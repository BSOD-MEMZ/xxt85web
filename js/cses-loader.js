/**
 * CSES 课程表加载器
 * 负责加载、解析、缓存 CSES YAML 课程表数据
 * 支持从 localStorage 读取用户上传的课表，或从默认路径加载
 */
(function () {
  'use strict';

  var CSES_STORAGE_KEY = 'cses_yaml_data';
  var CSES_META_KEY = 'cses_meta';

  /**
   * YAML 解析：优先使用 js-yaml（ClassBoard 同款方案）
   */
  function parseYAML(yamlStr) {
    if (typeof window.jsyaml !== 'undefined' && typeof window.jsyaml.load === 'function') {
      return window.jsyaml.load(yamlStr);
    }
    // 回退：简易解析器
    return parseYAMLSimple(yamlStr);
  }

  /** 简易解析器（js-yaml 不可用时回退） */
  function parseYAMLSimple(yamlStr) {
    var lines = yamlStr.split(/\r?\n/);
    var root = {};
    var stack = [{ obj: root, indent: -1, key: null }];
    var listContext = null; // 当前是否在列表项的上下文中

    function getIndent(line) {
      var m = line.match(/^(\s*)/);
      return m ? m[1].length : 0;
    }

    function parseValue(val) {
      val = val.trim();
      // 去掉行尾注释（但不触碰引号内的 #）
      if (val.indexOf("'") === -1 && val.indexOf('"') === -1) {
        var commentIdx = val.indexOf(' #');
        if (commentIdx === -1) commentIdx = val.indexOf('\t#');
        if (commentIdx > -1) val = val.substring(0, commentIdx).trim();
      }
      // 去掉首尾引号
      if ((val.startsWith("'") && val.endsWith("'")) ||
          (val.startsWith('"') && val.endsWith('"'))) {
        val = val.substring(1, val.length - 1);
      }
      // 空字符串
      if (val === "''" || val === '""' || val === '') return '';
      // 数字
      if (/^-?\d+\.?\d*$/.test(val)) {
        return val.indexOf('.') > -1 ? parseFloat(val) : parseInt(val, 10);
      }
      // 布尔
      if (val === 'true') return true;
      if (val === 'false') return false;
      if (val === 'null' || val === '~') return null;
      return val;
    }

    function popToIndent(indent, exclusive) {
      while (stack.length > 1 && stack[stack.length - 1].indent > indent) {
        listContext = null;
        stack.pop();
      }
      // 非排他模式: 同级也弹出（用于键值对回归父级）
      if (!exclusive && stack.length > 1 && stack[stack.length - 1].indent === indent) {
        listContext = null;
        stack.pop();
      }
    }

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      // 跳过空行和纯注释行
      if (/^\s*$/.test(line) || /^\s*#/.test(line)) continue;

      var indent = getIndent(line);
      var trimmed = line.trim();

      // 列表项: - key: value 或 - value  (排他模式，不弹出同级容器)
      var listItemMatch = trimmed.match(/^-\s+(.*)$/);
      if (listItemMatch) {
        popToIndent(indent, true);
        var parent = stack[stack.length - 1].obj;
        var parentKey = stack[stack.length - 1].key;

        // 确保父级是数组，并同步更新栈顶引用
        if (parentKey && !Array.isArray(parent[parentKey])) {
          parent[parentKey] = [];
          // 更新栈中引用（classes 容器从 {} 变成 []）
          for (var si = stack.length - 1; si >= 0; si--) {
            if (stack[si].key === parentKey && stack[si].obj === parent[parentKey]) break;
            if (stack[si].key === parentKey) {
              stack[si].obj = parent[parentKey];
              break;
            }
          }
        }

        var rest = listItemMatch[1];
        var kvMatch = rest.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(.*)$/);

        if (kvMatch) {
          // - key: value 形式 → 新对象
          var newObj = {};
          newObj[kvMatch[1]] = parseValue(kvMatch[2]);
          if (parentKey) {
            parent[parentKey].push(newObj);
          }
          stack.push({ obj: newObj, indent: indent, key: null });
          listContext = newObj;
        } else {
          // - value 形式（简单列表）
          var val = parseValue(rest);
          if (parentKey) {
            parent[parentKey].push(val);
          }
          listContext = null;
        }
        continue;
      }

      // 键值对: key: value
      var kvMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(.*)$/);
      if (kvMatch) {
        var key = kvMatch[1];
        var val = kvMatch[2].trim();

        popToIndent(indent);

        var currentParent = stack[stack.length - 1].obj;

        if (val === '' || val === '|' || val === '>') {
          // 多行值或子对象标记 - 创建空对象占位
          currentParent[key] = {};
          stack.push({ obj: currentParent[key], indent: indent, key: key });
        } else {
          currentParent[key] = parseValue(val);
        }
        continue;
      }

      // 可能是多行字符串的延续或其他
    }

    return root;
  }

  /**
   * 时间字符串 "HH:MM:SS" → 当天分钟数
   */
  function timeToMinutes(timeStr) {
    var parts = String(timeStr).split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10) + (parseInt(parts[2] || '0', 10)) / 60;
  }

  /**
   * 分钟数 → "HH:MM" 字符串
   */
  function minutesToTime(minutes) {
    var h = Math.floor(minutes / 60);
    var m = Math.floor(minutes % 60);
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  }

  /**
   * 获取当前是当年的第几周（ISO 周）
   */
  function getCurrentWeekNumber() {
    var now = getNow();
    var start = new Date(now.getFullYear(), 0, 1);
    var diff = (now - start + (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60000) / 86400000;
    return Math.ceil((diff + start.getDay() + 1) / 7);
  }

  /**
   * 判断当前是单周还是双周
   */
  function isOddWeek() {
    return getCurrentWeekNumber() % 2 === 1;
  }

  // ========== 调试时间覆盖 ==========
  var CSES_DEBUG_KEY = 'cses_debug_time';
  var CSES_VALID_FROM = 'cses_valid_from';
  var CSES_VALID_UNTIL = 'cses_valid_until';

  function getNow() {
    try {
      var override = localStorage.getItem(CSES_DEBUG_KEY);
      if (override) {
        var d = new Date(override);
        if (!isNaN(d.getTime())) return d;
      }
    } catch (e) {}
    return new Date();
  }

  /**
   * 获取今天是周几（1=周一, 7=周日）
   */
  function getTodayDayOfWeek() {
    var d = getNow().getDay();
    return d === 0 ? 7 : d; // 转换为 1-7
  }

  // ========== 公开 API ==========

  var CSESLoader = {
    _data: null,
    _subjectMap: null,

    /**
     * 加载 CSES 数据
     * 优先从 localStorage 读取用户上传的课表
     * 否则 fetch 默认课表 support/cses/xxt.yml
     */
    load: function () {
      var self = this;
      var stored = null;
      try {
        stored = localStorage.getItem(CSES_STORAGE_KEY);
      } catch (e) { /* ignore */ }

      if (stored) {
        try {
          self._data = parseYAML(stored);
          self._buildSubjectMap();
          return Promise.resolve(self._data);
        } catch (e) {
          console.warn('CSES: 解析本地课表失败，将加载默认课表', e);
        }
      }

      return fetch('support/cses/xxt.yml')
        .then(function (resp) {
          if (!resp.ok) throw new Error('HTTP ' + resp.status);
          return resp.text();
        })
        .then(function (text) {
          self._data = parseYAML(text);
          try { localStorage.setItem(CSES_STORAGE_KEY, text); } catch (e) {}
          self._buildSubjectMap();
          return self._data;
        })
        .catch(function (err) {
          console.warn('CSES: fetch 默认课表失败 (' + err.message + ')，将尝试使用 localStorage 缓存。如果是 file:// 协议，fetch 受 CORS 限制这是正常的。');
          return Promise.resolve(null);
        });
    },

    /**
     * 构建科目名称 → 科目信息的映射
     */
    _buildSubjectMap: function () {
      this._subjectMap = {};
      var subjects = this._data && this._data.subjects;
      if (!subjects || !Array.isArray(subjects)) return;
      for (var i = 0; i < subjects.length; i++) {
        var s = subjects[i];
        this._subjectMap[s.name] = s;
        if (s.simplified_name) {
          this._subjectMap[s.simplified_name] = s;
        }
      }
    },

    /**
     * 获取科目信息
     */
    getSubject: function (name) {
      if (!this._subjectMap) return null;
      return this._subjectMap[name] || null;
    },

    /**
     * 获取课表配置名称
     */
    getName: function () {
      if (!this._data) return '课程表';
      var cfg = this._data.configuration;
      return (cfg && cfg.name) || this._data.name || '课程表';
    },

    isScheduleValid: function () {
      try {
        // 优先读取 CSES 数据内的 configuration 有效期
        var cfg = (this._data && this._data.configuration) || {};
        var from = cfg.valid_from || localStorage.getItem(CSES_VALID_FROM) || '';
        var until = cfg.valid_until || localStorage.getItem(CSES_VALID_UNTIL) || '';
        if (!from && !until) return true;
        var today = getNow();
        var todayStr = today.getFullYear() + '-' +
          String(today.getMonth() + 1).padStart(2, '0') + '-' +
          String(today.getDate()).padStart(2, '0');
        if (from && todayStr < String(from)) return false;
        if (until && todayStr > String(until)) return false;
        return true;
      } catch (e) { return true; }
    },

    getValidRange: function () {
      try {
        var cfg = (this._data && this._data.configuration) || {};
        return {
          from: String(cfg.valid_from || localStorage.getItem(CSES_VALID_FROM) || ''),
          until: String(cfg.valid_until || localStorage.getItem(CSES_VALID_UNTIL) || '')
        };
      } catch (e) { return { from: '', until: '' }; }
    },

    setValidRange: function (from, until) {
      try {
        if (from) localStorage.setItem(CSES_VALID_FROM, from);
        else localStorage.removeItem(CSES_VALID_FROM);
        if (until) localStorage.setItem(CSES_VALID_UNTIL, until);
        else localStorage.removeItem(CSES_VALID_UNTIL);
        // 同步写入内存中的 CSES 数据
        if (this._data) {
          if (!this._data.configuration) this._data.configuration = {};
          if (from) this._data.configuration.valid_from = from;
          else delete this._data.configuration.valid_from;
          if (until) this._data.configuration.valid_until = until;
          else delete this._data.configuration.valid_until;
        }
      } catch (e) {}
    },

    /**
     * 获取今天的课程安排
     * 返回 { scheduleName, classes: [...] }
     */
    getTodaySchedule: function () {
      if (!this._data || !this._data.schedules) return null;
      if (!this.isScheduleValid()) return false; // false = 不在有效期内

      var today = getTodayDayOfWeek();
      var odd = isOddWeek();
      var schedules = this._data.schedules;
      var matchedSchedules = [];

      for (var i = 0; i < schedules.length; i++) {
        var sch = schedules[i];
        var enableDay = sch.enable_day;

        // 处理 enable_day（可能是数字或数组）
        var days = Array.isArray(enableDay) ? enableDay : [enableDay];
        if (days.indexOf(today) === -1) continue;

        // 处理 weeks 字段（兼容多种写法）
        var weeks = String(sch.weeks || 'all').toLowerCase().trim();
        if (weeks === 'odd' || weeks === 'single' || weeks === 'dan' || weeks === '单' || weeks === '单周') {
          if (!odd) continue;
        } else if (weeks === 'even' || weeks === 'double' || weeks === 'shuang' || weeks === '双' || weeks === '双周') {
          if (odd) continue;
        }

        // 按 start_time 排序 classes
        var classes = (sch.classes || []).slice();
        classes.sort(function (a, b) {
          return timeToMinutes(a.start_time) - timeToMinutes(b.start_time);
        });

        matchedSchedules.push({
          name: sch.name,
          classes: classes
        });
      }

      return matchedSchedules.length > 0 ? matchedSchedules : null;
    },

    /**
     * 获取当前正在进行的课程（含进度信息）
     * 返回 null 如果当前不在上课时间
     * 返回 { subject, subjectInfo, startTime, endTime, startMin, endMin, nowMin, progress, remaining, total }
     */
    getCurrentClass: function () {
      var todaySchedules = this.getTodaySchedule();
      if (!todaySchedules) return null;

      var now = getNow();
      var nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;

      // 合并所有今天 schedules 的 classes
      var allClasses = [];
      for (var i = 0; i < todaySchedules.length; i++) {
        var sch = todaySchedules[i];
        for (var j = 0; j < sch.classes.length; j++) {
          allClasses.push(sch.classes[j]);
        }
      }

      // 按 start_time 排序
      allClasses.sort(function (a, b) {
        return timeToMinutes(a.start_time) - timeToMinutes(b.start_time);
      });

      for (var k = 0; k < allClasses.length; k++) {
        var cls = allClasses[k];
        var startMin = timeToMinutes(cls.start_time);
        var endMin = timeToMinutes(cls.end_time);

        if (nowMin >= startMin && nowMin < endMin) {
          var total = endMin - startMin;
          var elapsed = nowMin - startMin;
          var remaining = endMin - nowMin;
          var progress = total > 0 ? Math.min(100, Math.max(0, (elapsed / total) * 100)) : 0;

          return {
            subject: cls.subject,
            subjectInfo: this.getSubject(cls.subject),
            startTime: cls.start_time,
            endTime: cls.end_time,
            startMin: startMin,
            endMin: endMin,
            nowMin: nowMin,
            progress: progress,
            remaining: remaining,
            total: total,
            remainingStr: this._formatRemaining(remaining)
          };
        }
      }

      return null;
    },

    /**
     * 获取下一节课
     */
    getNextClass: function () {
      var todaySchedules = this.getTodaySchedule();
      if (!todaySchedules) return null;

      var now = getNow();
      var nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;

      var allClasses = [];
      for (var i = 0; i < todaySchedules.length; i++) {
        var sch = todaySchedules[i];
        for (var j = 0; j < sch.classes.length; j++) {
          allClasses.push(sch.classes[j]);
        }
      }

      allClasses.sort(function (a, b) {
        return timeToMinutes(a.start_time) - timeToMinutes(b.start_time);
      });

      for (var k = 0; k < allClasses.length; k++) {
        var cls = allClasses[k];
        if (timeToMinutes(cls.start_time) > nowMin) {
          return {
            subject: cls.subject,
            subjectInfo: this.getSubject(cls.subject),
            startTime: cls.start_time,
            endTime: cls.end_time
          };
        }
      }

      return null;
    },

    /**
     * 格式化剩余时间
     */
    _formatRemaining: function (minutes) {
      if (minutes <= 0) return '已结束';
      var h = Math.floor(minutes / 60);
      var m = Math.floor(minutes % 60);
      if (h > 0) {
        return '还剩 ' + h + ' 小时 ' + m + ' 分钟';
      }
      return '还剩 ' + m + ' 分钟';
    },

    /**
     * 格式化时间为 HH:MM
     */
    formatTime: function (timeStr) {
      var parts = String(timeStr).split(':');
      return parts[0] + ':' + parts[1];
    },

    /**
     * 保存用户上传的课表到 localStorage
     */
    saveUpload: function (yamlText) {
      try {
        // 先解析验证
        var data = parseYAML(yamlText);
        if (!data || !data.subjects || !data.schedules) {
          return { success: false, error: '无效的 CSES 格式：缺少 subjects 或 schedules 字段' };
        }
        localStorage.setItem(CSES_STORAGE_KEY, yamlText);
        this._data = data;
        this._buildSubjectMap();
        return { success: true, name: this.getName() };
      } catch (e) {
        return { success: false, error: 'YAML 解析失败：' + e.message };
      }
    },

    /**
     * 清除用户上传的课表，恢复默认
     */
    resetToDefault: function () {
      try {
        localStorage.removeItem(CSES_STORAGE_KEY);
        this._data = null;
        this._subjectMap = null;
      } catch (e) { /* ignore */ }
    },

    /**
     * 检查是否有用户上传的课表
     */
    hasCustomSchedule: function () {
      try {
        return localStorage.getItem(CSES_STORAGE_KEY) !== null;
      } catch (e) { return false; }
    }
  };

  // 暴露到全局
  CSESLoader.timeToMinutes = timeToMinutes;
  CSESLoader.minutesToTime = minutesToTime;
  CSESLoader.getTodayDayOfWeek = getTodayDayOfWeek;
  CSESLoader.isOddWeek = isOddWeek;
  CSESLoader.getNow = getNow;
  CSESLoader.setDebugTime = function (isoStr) {
    try { localStorage.setItem(CSES_DEBUG_KEY, isoStr); } catch (e) {}
  };
  CSESLoader.clearDebugTime = function () {
    try { localStorage.removeItem(CSES_DEBUG_KEY); } catch (e) {}
  };
  CSESLoader.hasDebugTime = function () {
    try { return !!localStorage.getItem(CSES_DEBUG_KEY); } catch (e) { return false; }
  };
  window.CSESLoader = CSESLoader;
})();
