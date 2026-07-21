/**
 * xxtsoft 账号系统 — 认证模块
 * 依赖: js/supabase.js（必须先加载）
 * 
 * 提供:
 *   - 注册（email + password + username）
 *   - 登录（email + password）
 *   - 登出
 *   - 会话恢复
 *   - 用户资料读写
 *   - 导航栏状态更新
 */

(function () {
  'use strict';

  // ===================== 等待 Supabase 就绪 =====================
  var AUTH_READY = false;
  var _pendingCalls = [];

  function getSB() {
    return window.__xxtSupabase || null;
  }

  function whenReady(fn) {
    if (AUTH_READY) { fn(); return; }
    if (getSB()) { AUTH_READY = true; fn(); return; }
    _pendingCalls.push(fn);
  }

  document.addEventListener('xxt:supabase-ready', function () {
    AUTH_READY = true;
    var calls = _pendingCalls;
    _pendingCalls = [];
    calls.forEach(function (f) { try { f(); } catch (e) { console.error(e); } });
  });

  // 如果 DOM 已加载但 Supabase 也已在之前加载
  if (getSB()) {
    AUTH_READY = true;
  }

  // ===================== 公开 API =====================
  var Auth = {};

  /**
   * 注册新用户
   * @param {string} email
   * @param {string} password
   * @param {string} username
   * @param {string} avatar - 头像编号 "1"~"13"，空字符串表示不选
   * @param {object} extra - 额外字段 { bio, birthday, love, hate, goal }
   * @returns {Promise<{user, error}>}
   */
  Auth.signUp = function (email, password, username, avatar, extra) {
    var sb = getSB();
    if (!sb) return Promise.resolve({ user: null, error: 'Supabase 未初始化' });
    extra = extra || {};

    return sb.auth.signUp({ email: email, password: password }).then(function (result) {
      if (result.error) return { user: null, error: result.error.message };

      var user = result.data.user;
      if (!user) return { user: null, error: '注册失败，请稍后再试' };

      // 创建 profiles 记录
      return sb.from('profiles').insert({
        id: user.id,
        username: username,
        avatar_url: avatar || '1',
        bio: extra.bio || '',
        birthday: extra.birthday || null,
        love: extra.love || '',
        hate: extra.hate || '',
        goal: extra.goal || '',
        role: 'user',
        created_at: new Date().toISOString()
      }).then(function (profileResult) {
        if (profileResult.error) {
          // 不再静默吞掉错误，返回给用户
          return { user: user, error: '创建用户资料失败: ' + profileResult.error.message };
        }
        return { user: user, error: null };
      });
    });
  };

  /**
   * 发送密码重置邮件
   * @param {string} email
   * @returns {Promise<{error}>}
   */
  Auth.resetPassword = function (email) {
    var sb = getSB();
    if (!sb) return Promise.resolve({ error: 'Supabase 未初始化' });
    return sb.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/account.html'
    }).then(function (result) {
      return { error: result.error ? result.error.message : null };
    });
  };

  /**
   * 设置新密码（从重置邮件回来后调用）
   * @param {string} newPassword
   * @returns {Promise<{error}>}
   */
  Auth.updatePassword = function (newPassword) {
    var sb = getSB();
    if (!sb) return Promise.resolve({ error: 'Supabase 未初始化' });
    return sb.auth.updateUser({ password: newPassword }).then(function (result) {
      return { error: result.error ? result.error.message : null };
    });
  };

  /**
   * 登录
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{user, error}>}
   */
  Auth.signIn = function (email, password) {
    var sb = getSB();
    if (!sb) return Promise.resolve({ user: null, error: 'Supabase 未初始化' });

    return sb.auth.signInWithPassword({ email: email, password: password }).then(function (result) {
      if (result.error) return { user: null, error: result.error.message };
      return { user: result.data.user, error: null };
    });
  };

  /**
   * 登出
   */
  Auth.signOut = function () {
    var sb = getSB();
    if (!sb) return Promise.resolve();
    return sb.auth.signOut();
  };

  /**
   * 获取当前会话
   */
  Auth.getSession = function () {
    var sb = getSB();
    if (!sb) return Promise.resolve(null);
    return sb.auth.getSession().then(function (result) {
      return result.data.session || null;
    });
  };

  /**
   * 获取当前用户
   */
  Auth.getUser = function () {
    var sb = getSB();
    if (!sb) return Promise.resolve(null);
    return sb.auth.getUser().then(function (result) {
      return result.data.user || null;
    });
  };

  /**
   * 获取用户资料（从 profiles 表）
   */
  Auth.getProfile = function (userId) {
    var sb = getSB();
    if (!sb) return Promise.resolve(null);
    return sb.from('profiles').select('*').eq('id', userId).single().then(function (result) {
      return result.data || null;
    });
  };

  /**
   * 更新用户资料（有则更新，无则插入）
   */
  Auth.updateProfile = function (userId, updates) {
    var sb = getSB();
    if (!sb) return Promise.resolve({ error: { message: 'Supabase 未初始化' } });
    // 用 upsert 确保 profiles 行一定存在
    return sb.from('profiles').upsert(Object.assign({ id: userId }, updates), { onConflict: 'id' });
  };

  /**
   * 将存储的头像编号转为实际图片路径
   * @param {string} avatarId - "0"~"13"，"0" 表示未设置
   * @returns {string} 实际图片 URL
   */
  Auth.getAvatarUrl = function (avatarId) {
    var id = parseInt(avatarId, 10);
    if (id >= 1 && id <= 13) return 'images/avatars/usertile' + id + '.jpg';
    if (id === 14) return 'images/avatars/usertile14.jpg.png';
    if (id >= 15 && id <= 34) return 'images/avatars/usertile' + id + '.gif';
    return 'images/avatars/usertile1.jpg';
  };

  /**
   * 将 Supabase 错误信息翻译为中文
   * @param {string} message - 原始错误消息
   * @returns {string} 中文消息
   */
  function translateError(message) {
    if (!message) return '发生未知错误';

    // 精确匹配优先
    var map = {
      'Invalid login credentials': '邮箱或密码错误，请检查后重试。',
      'User already registered': '该邮箱已被注册，请直接登录或使用其他邮箱。',
      'Email not confirmed': '邮箱尚未验证，请前往邮箱点击验证链接。',
      'Password should be at least 6 characters': '密码长度不能少于 6 个字符。',
      'Email rate limit exceeded': '操作过于频繁，请稍后再试。',
      'For security purposes, you can only request this after': '操作过于频繁，请稍后再试。',
      'Invalid Refresh Token: Already Used': '登录已过期，请重新登录。',
      'Invalid Refresh Token: Refresh Token Not Found': '登录已过期，请重新登录。',
      'No API key found in request': '服务器配置错误，请联系站长。',
      'Database error saving new user': '创建用户失败，请稍后再试。',
      'Unable to validate email address: invalid format': '邮箱格式不正确。',
      'A user with this email address has already been registered': '该邮箱已被注册。',
      'Signup requires a valid password': '请输入有效密码。',
      'User not allowed': '注册功能暂未开放。',
      'Request is not acceptable': '请求不被接受，请联系站长。',
    };

    // 精确匹配
    if (map[message]) return map[message];

    // 模糊匹配
    if (message.indexOf('already registered') !== -1) return '该邮箱已被注册，请直接登录或使用其他邮箱。';
    if (message.indexOf('Invalid login') !== -1) return '邮箱或密码错误，请检查后重试。';
    if (message.indexOf('rate limit') !== -1) return '操作过于频繁，请稍后再试。';
    if (message.indexOf('not confirmed') !== -1) return '邮箱尚未验证，请前往邮箱点击验证链接。';
    if (message.indexOf('expired') !== -1) return '登录已过期，请重新登录。';
    if (message.indexOf('Database error') !== -1) return '服务器处理失败，请稍后再试。';

    return message;
  }

  /**
   * 显示 Windows 风格错误对话框
   * @param {string} message - 错误消息（自动翻译为中文）
   */
  Auth.showErrorDialog = function (message) {
    var dialog = document.getElementById('authErrorDialog');
    var msgEl = document.getElementById('authErrorMsg');
    if (!dialog || !msgEl) return;
    msgEl.textContent = translateError(message);
    dialog.style.display = 'block';
  };

  /**
   * 隐藏错误对话框
   */
  Auth.hideErrorDialog = function () {
    var dialog = document.getElementById('authErrorDialog');
    if (dialog) dialog.style.display = 'none';
  };

  /** 绑定错误对话框事件（页面加载后调用一次） */
  Auth.bindErrorDialog = function () {
    var dialog = document.getElementById('authErrorDialog');
    if (!dialog) return;

    // 关闭按钮
    var closeBtn = document.getElementById('closeAuthError');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        dialog.style.display = 'none';
      });
    }

    // 确定按钮
    var okBtn = document.getElementById('btnAuthErrorOk');
    if (okBtn) {
      okBtn.addEventListener('click', function () {
        dialog.style.display = 'none';
      });
    }
  };

  // ===================== 导航栏状态更新 =====================
  var navbarInserted = false;

  Auth.updateNavbar = function () {
    whenReady(function () {
      Auth.getUser().then(function (user) {
        injectNavbarAuth(user);
      });
    });
  };

  function injectNavbarAuth(user) {
    // 在所有 .navbar ul 中添加登录/用户入口
    var navbars = document.querySelectorAll('.navbar ul');
    navbars.forEach(function (ul) {
      if (ul.querySelector('.nav-auth-item')) return; // 已注入

      var li = document.createElement('li');
      li.className = 'nav-auth-item';
      li.style.cssText = 'float:right;';

      if (user) {
        // 已登录 —— 显示头像镜框 + 用户名
        Auth.getProfile(user.id).then(function (profile) {
          var username = (profile && profile.username) || user.email.split('@')[0];
          var avatarSrc = Auth.getAvatarUrl(profile ? profile.avatar_url : '1');
          li.innerHTML = '<a href="account.html" target="_self" style="display:flex;align-items:center;gap:4px;">'
            + '<span style="display:inline-block;position:relative;width:16px;height:16px;flex-shrink:0;vertical-align:middle;">'
            + '<img src="' + avatarSrc + '" alt="" style="position:absolute;top:3px;left:3px;width:10px;height:10px;object-fit:cover;">'
            + '<img src="images/avatarframe16.png" alt="" style="position:absolute;top:0;left:0;width:16px;height:16px;pointer-events:none;">'
            + '</span>'
            + '<span class="nav-username">' + escapeHTML(username) + '</span>'
            + '</a>';
        }).catch(function () {
          li.innerHTML = '<a href="account.html" target="_self">'
          + '<img src="images/icons/addpeople.png" alt="" width="14" height="14" style="vertical-align:middle;">'
            + ' 我的账号</a>';
        });
      } else {
        // 未登录 — 雪碧图动画图标
        li.innerHTML = '<a href="account.html" target="_self">'
          + '<span class="nav-passport-icon" style="display:inline-block;width:16px;height:16px;vertical-align:middle;background:url(images/passportscan.png) 0 0 no-repeat;"></span>'
          + ' 登录 / 注册</a>';
      }

      ul.appendChild(li);
      navbarInserted = true;
    });
  }

  // ===================== 账户页面专用：注册向导逻辑 =====================
  Auth.initWizard = function () {
    whenReady(function () {
      // 密码重置回调：URL hash 含 type=recovery
      if (window.location.hash.indexOf('type=recovery') !== -1) {
        showRecoveryView();
        return;
      }

      // 先检查是否已登录
      Auth.getUser().then(function (user) {
        if (user) {
          showProfileView(user);
        } else {
          showWizardView();
        }
      });
    });
  };

  function showRecoveryView() {
    var wizardEl = document.getElementById('authWizard');
    var profileEl = document.getElementById('authProfile');
    var recoveryEl = document.getElementById('passwordRecoveryPanel');
    var tabsEl = document.getElementById('wizardTabs');
    if (wizardEl) wizardEl.style.display = 'block';
    if (profileEl) profileEl.style.display = 'none';
    if (recoveryEl) recoveryEl.style.display = 'block';
    if (tabsEl) tabsEl.style.display = 'none';
    hideAllPanels();

    // 绑定设置新密码事件
    var recoveryForm = document.getElementById('recoveryForm');
    if (recoveryForm) {
      recoveryForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var pwd = document.getElementById('newPassword').value;
        var confirm = document.getElementById('newPasswordConfirm').value;
        var btn = document.getElementById('recoveryBtn');

        if (!pwd || pwd.length < 6) {
          Auth.showErrorDialog('密码至少需要 6 个字符');
          return;
        }
        if (pwd !== confirm) {
          Auth.showErrorDialog('两次输入的密码不一致');
          return;
        }

        setBtnLoading(btn, true);
        Auth.updatePassword(pwd).then(function (result) {
          setBtnLoading(btn, false);
          if (result.error) {
            Auth.showErrorDialog(result.error);
          } else {
            Auth.showErrorDialog('密码已重置成功，请使用新密码登录。');
            // 清除 hash 并刷新
            if (window.history && window.history.replaceState) {
              window.history.replaceState(null, '', window.location.pathname);
            }
            setTimeout(function () { window.location.reload(); }, 2000);
          }
        });
      });
    }
  }

  function showWizardView() {
    var wizardEl = document.getElementById('authWizard');
    var profileEl = document.getElementById('authProfile');
    if (wizardEl) wizardEl.style.display = 'block';
    if (profileEl) profileEl.style.display = 'none';

    // 绑定事件
    bindWizardEvents();
  }

  function showProfileView(user) {
    var wizardEl = document.getElementById('authWizard');
    var profileEl = document.getElementById('authProfile');
    if (wizardEl) wizardEl.style.display = 'none';
    if (profileEl) profileEl.style.display = 'block';

    // 填充用户信息（profiles 行丢失时自动补建）
    Auth.getProfile(user.id).then(function (profile) {
      if (!profile) {
        // profiles 行不存在，用 upsert 补一个
        var emailName = (user.email || 'user').split('@')[0];
        Auth.updateProfile(user.id, {
          username: emailName,
          avatar_url: '1',
          bio: '',
          role: 'user',
          created_at: new Date().toISOString()
        }).then(function () {
          // 重新读取
          return Auth.getProfile(user.id);
        }).then(function (newProfile) {
          fillProfileUI(user, newProfile);
        });
      } else {
        fillProfileUI(user, profile);
      }
    });

    // 绑定资料编辑和登出
    bindProfileEvents(user);
  }

  function fillProfileUI(user, profile) {
    var usernameEl = document.getElementById('profileUsername');
    var emailEl = document.getElementById('profileEmail');
    var bioEl = document.getElementById('profileBio');
    var avatarImg = document.getElementById('profileAvatarImg');
    var joinDateEl = document.getElementById('profileJoinDate');
    var birthdayEl = document.getElementById('profileBirthday');
    var loveEl = document.getElementById('profileLove');
    var hateEl = document.getElementById('profileHate');
    var goalEl = document.getElementById('profileGoal');

    if (usernameEl) usernameEl.textContent = (profile && profile.username) || '未设置用户名';
    if (emailEl) emailEl.textContent = user.email || '';
    if (bioEl) bioEl.textContent = (profile && profile.bio) || '这个人很懒，什么都没写～';
    if (avatarImg) avatarImg.src = Auth.getAvatarUrl(profile ? profile.avatar_url : '1');
    if (joinDateEl && profile && profile.created_at) {
      joinDateEl.textContent = new Date(profile.created_at).toLocaleDateString('zh-CN');
    }
    if (birthdayEl) birthdayEl.textContent = (profile && profile.birthday) || '未设置';
    if (loveEl) loveEl.textContent = (profile && profile.love) || '未设置';
    if (hateEl) hateEl.textContent = (profile && profile.hate) || '未设置';
    if (goalEl) goalEl.textContent = (profile && profile.goal) || '未设置';
  }

  // ===================== 向导事件绑定 =====================
  var currentWizardStep = 'login'; // 'login' | 'register'

  function bindWizardEvents() {
    // Tab 切换
    var tabLogin = document.getElementById('tabLogin');
    var tabRegister = document.getElementById('tabRegister');
    var panelLogin = document.getElementById('panelLogin');
    var panelRegister = document.getElementById('panelRegister');

    if (tabLogin) {
      tabLogin.addEventListener('click', function () {
        currentWizardStep = 'login';
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        hideAllPanels();
        if (panelLogin) panelLogin.style.display = 'block';
      });
    }
    if (tabRegister) {
      tabRegister.addEventListener('click', function () {
        currentWizardStep = 'register';
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        hideAllPanels();
        if (panelRegister) panelRegister.style.display = 'block';
      });
    }

    // 登录表单
    var loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var email = document.getElementById('loginEmail').value.trim();
        var password = document.getElementById('loginPassword').value;
        var btn = document.getElementById('loginBtn');

        if (!email || !password) {
          Auth.showErrorDialog('请填写邮箱和密码');
          return;
        }

        setBtnLoading(btn, true);

        Auth.signIn(email, password).then(function (result) {
          setBtnLoading(btn, false);
          if (result.error) {
            Auth.showErrorDialog(result.error);
          } else {
            // 登录成功，刷新显示
            showProfileView(result.user);
            Auth.updateNavbar();
          }
        });
      });
    }

    // 注册表单
    var registerForm = document.getElementById('registerForm');
    if (registerForm) {
      registerForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var username = document.getElementById('regUsername').value.trim();
        var email = document.getElementById('regEmail').value.trim();
        var password = document.getElementById('regPassword').value;
        var confirm = document.getElementById('regConfirm').value;
        var avatar = getSelectedAvatar();
        var btn = document.getElementById('registerBtn');

        // 验证
        if (!username) { Auth.showErrorDialog('请输入用户名'); return; }
        if (username.length < 2) { Auth.showErrorDialog('用户名至少需要 2 个字符'); return; }
        if (!email) { Auth.showErrorDialog('请输入邮箱'); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { Auth.showErrorDialog('邮箱格式不正确'); return; }
        if (!password) { Auth.showErrorDialog('请输入密码'); return; }
        if (password.length < 6) { Auth.showErrorDialog('密码至少需要 6 个字符'); return; }
        if (password !== confirm) { Auth.showErrorDialog('两次输入的密码不一致'); return; }

        // 收集非必填字段
        var extra = {
          bio: (document.getElementById('regBio') || {}).value ? document.getElementById('regBio').value.trim() : '',
          birthday: (document.getElementById('regBirthday') || {}).value || '',
          love: (document.getElementById('regLove') || {}).value ? document.getElementById('regLove').value.trim() : '',
          hate: (document.getElementById('regHate') || {}).value ? document.getElementById('regHate').value.trim() : '',
          goal: (document.getElementById('reggoal') || {}).value ? document.getElementById('reggoal').value.trim() : ''
        };

        setBtnLoading(btn, true);

        Auth.signUp(email, password, username, avatar, extra).then(function (result) {
          setBtnLoading(btn, false);
          if (result.error) {
            Auth.showErrorDialog(result.error);
          } else {
            // 注册成功
            showWizardSuccess(username);
          }
        });
      });
    }

    // 忘记密码链接
    var linkForgot = document.getElementById('linkForgotPassword');
    var linkBack = document.getElementById('linkBackToLogin');
    if (linkForgot) {
      linkForgot.addEventListener('click', function () {
        hideAllPanels();
        var panelForgot = document.getElementById('panelForgotPassword');
        var tabLogin = document.getElementById('tabLogin');
        var tabRegister = document.getElementById('tabRegister');
        if (panelForgot) panelForgot.style.display = 'block';
        if (tabLogin) tabLogin.classList.remove('active');
        if (tabRegister) tabRegister.classList.remove('active');
      });
    }
    if (linkBack) {
      linkBack.addEventListener('click', function () {
        hideAllPanels();
        var panelLogin = document.getElementById('panelLogin');
        var tabLogin = document.getElementById('tabLogin');
        if (panelLogin) panelLogin.style.display = 'block';
        if (tabLogin) tabLogin.classList.add('active');
      });
    }

    // 忘记密码表单
    var forgotForm = document.getElementById('forgotForm');
    if (forgotForm) {
      forgotForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var email = document.getElementById('forgotEmail').value.trim();
        var btn = document.getElementById('forgotBtn');

        if (!email) { Auth.showErrorDialog('请输入邮箱地址'); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { Auth.showErrorDialog('邮箱格式不正确'); return; }

        setBtnLoading(btn, true);
        Auth.resetPassword(email).then(function (result) {
          setBtnLoading(btn, false);
          if (result.error) {
            Auth.showErrorDialog(result.error);
          } else {
            Auth.showErrorDialog('密码重置邮件已发送，请前往邮箱查看。');
            hideAllPanels();
            var panelLogin = document.getElementById('panelLogin');
            var tabLogin = document.getElementById('tabLogin');
            if (panelLogin) panelLogin.style.display = 'block';
            if (tabLogin) tabLogin.classList.add('active');
          }
        });
      });
    }
  }

  function hideAllPanels() {
    var ids = ['panelLogin', 'panelRegister', 'panelForgotPassword', 'passwordRecoveryPanel'];
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
  }

  function showWizardSuccess(username) {
    var successEl = document.getElementById('wizardSuccess');
    var panelLogin = document.getElementById('panelLogin');
    var panelRegister = document.getElementById('panelRegister');
    var tabsEl = document.getElementById('wizardTabs');
    var successMsg = document.getElementById('successMsg');

    if (panelLogin) panelLogin.style.display = 'none';
    if (panelRegister) panelRegister.style.display = 'none';
    if (tabsEl) tabsEl.style.display = 'none';
    if (successEl) successEl.style.display = 'block';
    if (successMsg) successMsg.textContent = '🎉 欢迎 ' + escapeHTML(username) + '！请检查邮箱并点击验证链接完成注册。验证后即可登录。';
  }

  // ===================== 个人资料页事件 =====================
  function bindProfileEvents(user) {
    // 登出按钮
    var logoutBtn = document.getElementById('btnLogout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        Auth.signOut().then(function () {
          window.location.reload();
        });
      });
    }

    // 编辑资料按钮
    var editBtn = document.getElementById('btnEditProfile');
    var editPanel = document.getElementById('editProfilePanel');
    if (editBtn && editPanel) {
      editBtn.addEventListener('click', function () {
        editPanel.style.display = editPanel.style.display === 'none' ? 'block' : 'none';
        // 预填当前值
        Auth.getProfile(user.id).then(function (profile) {
          var uEl = document.getElementById('editUsername');
          var bEl = document.getElementById('editBio');
          var bdEl = document.getElementById('editBirthday');
          var lEl = document.getElementById('editLove');
          var hEl = document.getElementById('editHate');
          var gEl = document.getElementById('editGoal');
          if (uEl) uEl.value = (profile && profile.username) || '';
          if (bEl) bEl.value = (profile && profile.bio) || '';
          if (bdEl) bdEl.value = (profile && profile.birthday) || '';
          if (lEl) lEl.value = (profile && profile.love) || '';
          if (hEl) hEl.value = (profile && profile.hate) || '';
          if (gEl) gEl.value = (profile && profile.goal) || '';
          // 预选当前头像
          var currentAvatar = (profile && profile.avatar_url) || '1';
          selectAvatarInPicker(currentAvatar);
        });
      });
    }

    // 保存资料
    var saveBtn = document.getElementById('btnSaveProfile');
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        var newUsername = document.getElementById('editUsername').value.trim();
        var newBio = document.getElementById('editBio').value.trim();
        var newBirthday = document.getElementById('editBirthday') ? document.getElementById('editBirthday').value : '';
        var newLove = document.getElementById('editLove') ? document.getElementById('editLove').value.trim() : '';
        var newHate = document.getElementById('editHate') ? document.getElementById('editHate').value.trim() : '';
        var newGoal = document.getElementById('editGoal') ? document.getElementById('editGoal').value.trim() : '';
        var newAvatar = getSelectedAvatarInEdit();
        var msgEl = document.getElementById('profileMsg');

        if (!newUsername || newUsername.length < 2) {
          Auth.showErrorDialog('用户名至少需要 2 个字符');
          return;
        }

        setBtnLoading(saveBtn, true);
        var updates = { username: newUsername, bio: newBio, birthday: newBirthday || null, love: newLove, hate: newHate, goal: newGoal };
        if (newAvatar !== null) updates.avatar_url = newAvatar;
        Auth.updateProfile(user.id, updates).then(function (result) {
          setBtnLoading(saveBtn, false);
          if (result.error) {
            Auth.showErrorDialog('保存失败: ' + (result.error.message || '未知错误'));
          } else {
            if (msgEl) { msgEl.textContent = '✅ 资料已更新'; msgEl.style.color = '#1a7f37'; }
            // 刷新资料显示
            var usernameEl = document.getElementById('profileUsername');
            var bioEl = document.getElementById('profileBio');
            var avatarImg = document.getElementById('profileAvatarImg');
            var birthdayEl = document.getElementById('profileBirthday');
            var loveEl = document.getElementById('profileLove');
            var hateEl = document.getElementById('profileHate');
            var goalEl = document.getElementById('profileGoal');
            if (usernameEl) usernameEl.textContent = newUsername;
            if (bioEl) bioEl.textContent = newBio || '这个人很懒，什么都没写～';
            if (avatarImg && newAvatar !== null) avatarImg.src = Auth.getAvatarUrl(newAvatar);
            if (birthdayEl) birthdayEl.textContent = newBirthday || '未设置';
            if (loveEl) loveEl.textContent = newLove || '未设置';
            if (hateEl) hateEl.textContent = newHate || '未设置';
            if (goalEl) goalEl.textContent = newGoal || '未设置';
            if (editPanel) editPanel.style.display = 'none';
            Auth.updateNavbar();
          }
        });
      });
    }
  }

  // ===================== 头像选择器 =====================
  /** 获取注册表单中选中的头像编号 */
  function getSelectedAvatar() {
    var active = document.querySelector('#registerForm .avatar-option.selected');
    return active ? active.getAttribute('data-avatar') : '1';
  }

  /** 获取编辑面板中选中的头像编号 */
  function getSelectedAvatarInEdit() {
    var active = document.querySelector('#editProfilePanel .avatar-option.selected');
    return active ? active.getAttribute('data-avatar') : null;
  }

  /** 在头像选择器中选中指定编号 */
  function selectAvatarInPicker(avatarId) {
    var picker = document.querySelector('#editProfilePanel .avatar-picker');
    if (!picker) return;
    var options = picker.querySelectorAll('.avatar-option');
    options.forEach(function (opt) {
      opt.classList.remove('selected');
      if (opt.getAttribute('data-avatar') === String(avatarId)) {
        opt.classList.add('selected');
      }
    });
  }

  /** 初始化所有头像选择器的点击事件，并动态生成选项 */
  Auth.initAvatarPickers = function () {
    var pickers = document.querySelectorAll('.avatar-picker');
    pickers.forEach(function (picker) {
      var totalAvatars = 34;
      var defaultSelected = picker.getAttribute('data-default') || '1';
      var html = '';
      for (var i = 1; i <= totalAvatars; i++) {
        var sel = (String(i) === defaultSelected) ? ' selected' : '';
        html += '<span class="avatar-option' + sel + '" data-avatar="' + i + '">';
        html += '<img src="' + Auth.getAvatarUrl(String(i)) + '" alt="头像' + i + '" loading="lazy">';
        html += '</span>';
      }
      picker.innerHTML = html;
    });

    // 点击选中
    document.addEventListener('click', function (e) {
      var option = e.target.closest('.avatar-option');
      if (!option) return;
      var picker = option.closest('.avatar-picker');
      if (!picker) return;
      picker.querySelectorAll('.avatar-option').forEach(function (o) {
        o.classList.remove('selected');
      });
      option.classList.add('selected');
    });
  };

  // ===================== 辅助函数 =====================
  function setBtnLoading(btn, loading) {
    if (!btn) return;
    if (loading) {
      btn.disabled = true;
      btn.setAttribute('data-original-text', btn.textContent);
      btn.textContent = '少女祈祷中...';
    } else {
      btn.disabled = false;
      var orig = btn.getAttribute('data-original-text');
      if (orig) btn.textContent = orig;
    }
  }

  function escapeHTML(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // ===================== 初始化 =====================
  // 页面加载后自动更新导航栏
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      Auth.updateNavbar();
    });
  } else {
    Auth.updateNavbar();
  }

  // 暴露到全局
  window.xxtAuth = Auth;

})();
