# Python 环境配置脚本 (uv)

这个目录包含用于在 `backend` 项目中配置 Python 环境的脚本。

## 文件列表

- `setup_env.ps1`: 自动化配置脚本。执行以下操作：
    - 检查 `uv` 是否安装。
    - 在 `backend` 根目录下创建虚拟环境 (`.venv`)。
    - 安装 `requirements.txt` 中的依赖。

## 如何运行

并在 PowerShell 中运行以下命令：

```powershell
./Scripts/setup_env.ps1
```

> [!NOTE]
> 如果您遇到脚本执行策略问题，请运行：
> `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process`
