# Kubernetes 管理連線憑證匯出與 Windows 11 安裝指南

本指南說明如何將現有 Kubernetes 叢集的管理連線憑證（`kubeconfig`）完整匯出，並在另一台 Windows 11 PC 上完成設定與連線測試。

---

## 目錄
1. [步驟一：從來源機器匯出 Kubeconfig](#步驟一步驟一從來源機器匯出-kubeconfig)
2. [步驟二：在 Windows 11 安裝 kubectl 工具](#步驟二在-windows-11-安裝-kubectl-工具)
3. [步驟三：配置 Windows 11 的連線設定檔](#步驟三配置-windows-11-的連線設定檔)
4. [步驟四：連線測試與驗證](#步驟四連線測試與驗證)
5. [常見情境與疑難排解](#常見情境與疑難排解)

---

## 步驟一：從來源機器匯出 Kubeconfig

為了確保連線設定在跨機器時不發生「憑證本機路徑不存在」的錯誤，必須使用 `--flatten` 參數，將 CA 憑證、用戶端憑證與金鑰直接內嵌（以 Base64 編碼）到單一檔案中。

### 情境 A：自建叢集 Control Plane 節點（例如 kubeadm）
若是從 Master/Control Plane 主機匯出管理員權限：

```bash
sudo kubectl config view --raw --flatten > k8s-admin-config.yaml
```

### 情境 B：既有已正常連線的用戶端主機
若來源電腦已有正常運作的 `kubectl` 環境，僅匯出當前生效的 Context：

```bash
kubectl config view --minify --raw --flatten > k8s-config.yaml
```

### 關鍵檢查：API Server IP 連線位址
請用文字編輯器開啟匯出的 YAML 檔案，確認 `clusters[].cluster.server` 的位址：
```yaml
clusters:
- cluster:
    certificate-authority-data: ...
    server: https://192.168.1.100:6443  # <--- 確認此 IP/網域在 Win11 電腦上可連通
  name: kubernetes
```
* **注意**：若顯示為 `127.0.0.1` 或 `localhost`，請替換為叢集對外實體 IP、內網實體 IP 或 DNS 域名。

---

## 步驟二：在 Windows 11 安裝 kubectl 工具

在 Windows 11 上開啟 **PowerShell**（建議以系統管理員身分執行），透過 Windows 套件管理員安裝：

### 1. 使用 winget 安裝
```powershell
winget install -e --id Kubernetes.kubectl
```
*(若使用 Chocolatey，亦可執行 `choco install kubernetes-cli`)*

### 2. 驗證安裝
關閉並重新開啟 PowerShell，確認命令可用：
```powershell
kubectl version --client
```

---

## 步驟三：配置 Windows 11 的連線設定檔

`kubectl` 在 Windows 上的預設讀取路徑為：`C:\Users\<你的使用者名稱>\.kube\config`（注意：檔名為 `config`，無附檔名）。

### 1. 建立目錄
在 PowerShell 中執行：
```powershell
New-Item -ItemType Directory -Force -Path "$HOME\.kube"
```

### 2. 放置設定檔
將在步驟一匯出的設定檔複製到 Windows PC（例如暫存在桌面），然後複製並重命名為 `config`：

```powershell
# 假設檔案暫存在桌面
Copy-Item -Path "$HOME\Desktop\k8s-config.yaml" -Destination "$HOME\.kube\config" -Force
```

---

## 步驟四：連線測試與驗證

在 PowerShell 中執行以下指令測試是否成功連線至叢集：

```powershell
# 1. 檢視當前 Context
kubectl config get-contexts

# 2. 檢查叢集節點狀態
kubectl get nodes

# 3. 列出所有命名空間中的 Pod
kubectl get pods -A
```

若能正確回傳節點與 Pod 清單，即表示憑證安裝成功。

---

## 常見情境與疑難排解

### 1. 目標 PC 上已有其他叢集設定（合併 Config）
若 Windows 11 上本來就有正在使用的 `.kube\config`，請勿直接覆蓋。請利用環境變數合併：

```powershell
# 設定臨時環境變數合併兩個檔案
$env:KUBECONFIG="$HOME\.kube\config;$HOME\Desktop\k8s-config.yaml"

# 匯出合併後的設定
kubectl config view --flatten > "$HOME\.kube\config_merged"

# 覆蓋回原設定檔
Move-Item -Path "$HOME\.kube\config_merged" -Destination "$HOME\.kube\config" -Force

# 清除環境變數
Remove-Item Env:\KUBECONFIG
```

### 2. 連線逾時（Connection Timeout）
* 檢查防火牆是否開放 Kubernetes API Server 連接埠（預設通常為 `6443`）。
* 測試網路連通性：
  ```powershell
  Test-NetConnection -ComputerName <API_SERVER_IP> -Port 6443
  ```

### 3. 憑證錯誤（x509: certificate is valid for ..., not ...）
若在叢集外部連線並更改了 `server` 位址，可能因該 IP 未被加入 API Server 的憑證主體別名（SAN）而報錯。臨時排查可於連線時加上 `--insecure-skip-tls-verify=true`，正式環境建議將目標 IP 加入 API Server 的憑證簽署列表中。