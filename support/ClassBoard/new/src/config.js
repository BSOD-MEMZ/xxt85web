export const STORAGE_KEY = 'classboard_vue_mdui_config_v1';

export const defaultConfig = {
  schoolName: '株洲市南方中学',
  classroomName: '高二（1）班教室',
  themeMode: 'auto',
  themeColor: '#2a5f9e',
  scheduleMode: 'simple',
  classStart: '18:40',
  classEnd: '20:20',
  preClassProgressWindow: 10,
  weatherEnabled: true,
  weatherCity: '株洲',
  weatherLatitude: 27.83,
  weatherLongitude: 113.15,
  csesRaw: '',
  csesFormat: 'auto',
  schedule: {
    odd: {
      0: { course: '班会', teacher: '班主任' },
      1: { course: '数学拓展', teacher: '周老师' },
      2: { course: '英语听说', teacher: '李老师' },
      3: { course: '物理实验', teacher: '陈老师' },
      4: { course: '语文阅读', teacher: '王老师' },
      5: { course: '信息技术', teacher: '刘老师' },
      6: { course: '社团活动', teacher: '指导老师' }
    },
    even: {
      0: { course: '体育康复', teacher: '任课老师' },
      1: { course: '化学提升', teacher: '赵老师' },
      2: { course: '历史专题', teacher: '唐老师' },
      3: { course: '生物探究', teacher: '吴老师' },
      4: { course: '地理实践', teacher: '孙老师' },
      5: { course: '政治时评', teacher: '何老师' },
      6: { course: '心理成长', teacher: '辅导老师' }
    }
  }
};

export const weatherCodeMap = {
  0: '晴',
  1: '大部晴朗',
  2: '多云',
  3: '阴',
  45: '有雾',
  48: '雾凇',
  51: '小毛毛雨',
  53: '毛毛雨',
  55: '大毛毛雨',
  61: '小雨',
  63: '中雨',
  65: '大雨',
  71: '小雪',
  73: '中雪',
  75: '大雪',
  80: '阵雨',
  81: '较强阵雨',
  82: '强阵雨',
  95: '雷暴'
};

export const dayLabels = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
