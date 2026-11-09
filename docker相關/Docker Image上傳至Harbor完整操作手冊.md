# Docker Image 上傳至 Harbor 完整操作手冊

本指南適用於本機已安裝 Docker 環境（如 Windows Docker Desktop），需將本機 Docker Image 推播至 Harbor 私有映像檔倉庫的場景。包含標準流程、常見憑證問題排解，以及自動化腳本撰寫。

---

## 目錄
1. [標準操作流程](#一標準操作流程)
2. [常見錯誤排除：TLS / 憑證問題](#二常見錯誤排除tls--憑證問題)
3. [進階觀念：設定 DNS 網域能解決憑證問題嗎？](#三進階觀念設定-dns-網域能解決憑證問題嗎)
4. [自動化作業：BAT 批次檔範例](#四自動化作業bat-批次檔範例)

---

## 一、標準操作流程

將本機映像檔推播至 Harbor，主要分為四個步驟：

### 步驟 1：確認 Harbor 專案（Project）
Harbor 的存放路徑採用階層結構：`<Harbor網址>/<專案名稱>/<映像檔名稱>:<標籤>`。
1. 登入 Harbor Web 管理介面。
2. 確認目標專案（如 `myproject`）是否存在；若無，請點擊 **New Project** 建立。

### 步驟 2：登入 Harbor（本機僅需執行一次）
開啟命令提示字元（CMD）或 PowerShell：

```bash
docker login <harbor-domain-or-ip>
```
*例如：`docker login 202.222.222.222` 或 `docker login harbor.example.com`*

* 輸入 Harbor 帳號與密碼（或 Robot Account Token）。
* 出現 `Login Succeeded` 即表示認證成功。登入資訊會保存在本機 `~/.docker/config.json`，後續推播無需重複手動登入。

### 步驟 3：為映像檔打上標籤（Tag）
將本機建置好的 Image 標記為 Harbor 格式路徑：

```bash
docker tag <local-image>:<tag> <harbor-domain-or-ip>/<project-name>/<image-name>:<tag>
```

**範例**：
```bash
docker tag myapp:v1.0 202.222.222.222/myproject/myapp:v1.0
```

### 步驟 4：推播映像檔（Push）
將標籤設定完成的映像檔推播至 Harbor：

```bash
docker push <harbor-domain-or-ip>/<project-name>/<image-name>:<tag>
```

**範例**：
```bash
docker push 202.222.222.222/myproject/myapp:v1.0
```

---

## 二、常見錯誤排除：TLS / 憑證問題

### 1. 錯誤現象
使用 IP 登入時常出現類似錯誤：
```text
Error response from daemon: Get "https://202.222.222.222/v2/": tls: failed to verify certificate: x509: cannot validate certificate for 202.222.222.222 because it doesn't contain any IP SANs
```
**原因**：Docker 預設強制走 HTTPS 驗證，若憑證中未包含該 IP 的主體替代名稱（IP SANs），或是使用自簽憑證，Docker Engine 會拒絕連線。

### 2. 解決方法（Docker Desktop on Windows）
1. 開啟 **Docker Desktop**。
2. 點擊右上角 **齒輪圖示（Settings）**。
3. 切換至左側 **Docker Engine**。
4. 在右側 JSON 設定中加入 `"insecure-registries"`：

```json
{
  "builder": {
    "gc": {
      "defaultKeepStorage": "20GB",
      "enabled": true
    }
  },
  "experimental": false,
  "insecure-registries": [
    "202.222.222.222"
  ]
}
```
*(若有特定 Port，例如 `:8443`，請一併填寫，如 `"202.222.222.222:8443"`)*

5. 點擊右下角 **Apply & restart**，等待 Docker 重啟完成後再次登入即可。

---

## 三、進階觀念：設定 DNS 網域能解決憑證問題嗎？

**關鍵取決於憑證的簽發單位與設定**：

| 情境 | 憑證來源 | 結果 | 說明 |
| :--- | :--- | :--- | :--- |
| **情境 A** | **公開合法 CA**（如 Let's Encrypt, DigiCert） |  **完全正常** | CA 預設信任且域名吻合，不需設定 `insecure-registries`。 |
| **情境 B** | **內部自簽憑證 / Harbor 預設憑證** | ❌ **依然報錯** | 錯誤訊息會轉為 `x509: certificate signed by unknown authority`。仍需將域名加入 `insecure-registries`，或手動匯入根憑證（`ca.crt`）。 |

---

## 四、自動化作業：BAT 批次檔範例

當第一次手動 `docker login` 成功後，本機已記錄登入 Token。未來可直接透過 `.bat` 批次檔一鍵完成建置與推播。

建立 `deploy.bat`：

```bat
@echo off
chcp 65001 >nul
echo ============================================
echo   Docker Build and Push to Harbor
echo ============================================

:: 參數設定
set REGISTRY=202.222.222.222
set PROJECT=myproject
set IMAGE_NAME=backend-service
set TAG=v1.0.0

set TARGET_IMAGE=%REGISTRY%/%PROJECT%/%IMAGE_NAME%:%TAG%

:: 1. 建置映像檔
echo [1/3] 正在建置 Docker 映像檔...
docker build -t %IMAGE_NAME%:%TAG% .
if errorlevel 1 (
    echo [ERROR] Docker build 失敗！
    pause
    exit /b %errorlevel%
)

:: 2. 打標籤
echo [2/3] 正在打上了 Harbor 標籤...
docker tag %IMAGE_NAME%:%TAG% %TARGET_IMAGE%

:: 3. 推播至 Harbor
echo [3/3] 正在推播映像檔到 Harbor (%TARGET_IMAGE%)...
docker push %TARGET_IMAGE%
if errorlevel 1 (
    echo [ERROR] 推播失敗，請檢查網路連線或登入狀態！
    pause
    exit /b %errorlevel%
)

echo.
echo ============================================
echo   上傳成功: %TARGET_IMAGE%
echo ============================================
pause
```

> **提示**：若此 BAT 腳本未來要在 Windows 排程器（Task Scheduler）或 CI/CD Service（如 Jenkins 服務）中無人值守執行，因服務帳號不同，建議在第一步前加上：
> ```bat
> echo <密碼或Token> | docker login %REGISTRY% -u <帳號> --password-stdin
> ```