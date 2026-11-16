# 云部署

## 当前公网状态

GitHub Pages 部署和外网访问验收待记录。Pages 公开静态托管可供演示，额外 15 分是否接受这种托管需要课程确认。

## GitHub Pages

本仓库的 `.github/workflows/pages.yml` 从 `main` 安装锁定依赖，执行 lint、测试和构建，将 `dist/` 上传至 Pages。GitHub 仓库的 Settings → Pages → Build and deployment → Source 应选择 GitHub Actions。工作流在成功部署后显示实际访问地址。 [GitHub Pages 官方配置](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

## Linux 云服务器 + Nginx

此方案适用于你已有授权的阿里云 ECS 或华为云 ECS Linux 实例。需要 SSH、部署账号的对应 sudo 权限、Nginx 和公网允许访问的 80 或 443 端口。没有云服务器权限，因此以下是可执行说明，当前未在对应服务器上运行。

1. 用系统包管理器安装 Nginx，并确认它已启动。配置安全组及系统防火墙，允许你用于验收的公网 HTTP(S) 访问。
2. 将 [contacthub.nginx.conf](../deploy/contacthub.nginx.conf) 放到服务器上的 Nginx 配置目录，例如 `/etc/nginx/conf.d/contacthub.conf`。若共享已有 Nginx，请把 `server_name` 改为你的域名并保留现有站点配置。
3. 在本地项目根目录执行 `bash scripts/deploy-nginx.sh user@server-hostname`。脚本构建后传输静态文件，写入单独的版本目录，通过 `current` 软链接切换。脚本要求部署账号可对所需命令使用 `sudo -n`。
4. 首次安装配置后在服务器检查 `sudo nginx -t`，再运行 `sudo systemctl reload nginx`。对外演示可用已有 HTTPS 域名。
5. 从另一个网络打开公网地址，验证首页、创建联系人、收藏、导出及导入。将真实地址写入博客和交付报告。

所有联系人数据保存在当前浏览器站点来源的 localStorage。不同域名、浏览器和设备的数据独立，可使用 Excel 文件迁移。
