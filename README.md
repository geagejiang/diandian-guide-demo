# 点点导游 · 静态演示

这是从唯一 Demo 自动生成的发布产物，不在此单独修改页面。

固定资料与本地规则回复，不调用真实 AI，无需 API Key、后端或数据库。保留搜索、阅读、主动保存、资料找回、规则行程与求建议预览。进度保存在当前浏览器，不跨设备同步。

## GitHub → Vercel

1. 将本目录内的 index.html、assets/、scripts/、styles/、vercel.json 和本说明上传至 GitHub 仓库根目录。不要上传上级 hosting/、node_modules/、.cloudflare/ 或密钥。
2. 登录 Vercel，Add New → Project → 导入该 GitHub 仓库。
3. Root Directory 选仓库根目录，Framework Preset 选 Other。无安装和构建命令，Output Directory 为 .（已通过 vercel.json 配置）。无需环境变量。
4. 点击 Deploy，打开实际返回的网址；用中国大陆普通手机流量和 Wi-Fi 实测，不能仅凭部署成功声称国内可用。
5. 分享正式生产地址，并检查 Deployment Protection 是否要求登录。

首页在根路径 /，无需追加 /demo/。
