# 简购商城 · Mini Shop

一个使用原生 **HTML + CSS + JavaScript** 搭建的轻量级电商网站演示，无需任何构建工具，可直接部署到 **GitHub Pages**。

## ✨ 功能特性

- 🏠 首页 Hero 与商品展示
- 🔍 商品搜索、分类筛选、排序（销量 / 价格 / 评分）
- 🛒 购物车（增删改、数量调整、本地持久化 `localStorage`）
- 🖼️ 商品详情弹窗
- 💳 模拟结算下单流程（含表单校验）
- 📱 响应式布局，适配手机 / 平板 / 桌面

## 🛠️ 技术栈

- HTML5
- CSS3（自定义属性 + Flex / Grid + 动画）
- 原生 JavaScript（无依赖）

## 📁 目录结构

```
mini-shop/
├── index.html          # 页面入口
├── css/
│   └── style.css       # 样式
├── js/
│   ├── data.js         # 商品数据
│   └── app.js          # 交互逻辑
├── images/             # 商品图（SVG 占位图）
└── README.md
```

## 🚀 本地运行

直接用浏览器打开 `index.html` 即可，或启动一个本地静态服务器：

```bash
# 任选其一
python -m http.server 8080
npx serve .
```

然后访问 <http://localhost:8080>。

## 🌐 部署到 GitHub Pages

1. 将本项目推送到 GitHub 仓库：

   ```bash
   git init
   git add .
   git commit -m "init: 简购商城电商网站"
   git branch -M main
   git remote add origin https://github.com/<你的用户名>/mini-shop.git
   git push -u origin main
   ```

2. 在仓库页面进入 **Settings → Pages**：
   - **Source** 选择 `Deploy from a branch`
   - **Branch** 选择 `main`，目录选择 `/ (root)`
   - 点击 **Save**

3. 稍等片刻，访问 `https://<你的用户名>.github.io/mini-shop/` 即可查看。

## 📝 说明

- 本项目为前端演示项目，**不包含真实支付与后端服务**，下单仅为流程演示。
- 商品图片为本地生成的 SVG 占位图，可替换为真实商品图。
- 商品数据在 `js/data.js` 中，可按需增删改。