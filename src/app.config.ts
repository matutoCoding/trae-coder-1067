export default defineAppConfig({
  pages: [
    'pages/schedule/index',
    'pages/pricing/index',
    'pages/bills/index',
    'pages/mine/index',
    'pages/station-detail/index',
    'pages/bill-detail/index',
    'pages/film-register/index',
    'pages/tier-config/index',
    'pages/revenue-dashboard/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1A1A2E',
    navigationBarTitleText: '暗房冲洗',
    navigationBarTextStyle: 'white',
    backgroundColor: '#1A1A2E'
  },
  tabBar: {
    color: '#7A7A9D',
    selectedColor: '#8B4513',
    backgroundColor: '#252542',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/schedule/index',
        text: '工位排期'
      },
      {
        pagePath: 'pages/pricing/index',
        text: '阶梯计费'
      },
      {
        pagePath: 'pages/bills/index',
        text: '账单管理'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
