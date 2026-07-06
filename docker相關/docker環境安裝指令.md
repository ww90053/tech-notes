# 步驟1
## 更新apt
``` Bash
rem 更新apt
sudo apt-get update
rem 必要的憑證輔助工具
sudo apt-get install ca-certificates curl gnupg
```
## 新增 Docker 官方 GPG 金鑰
``` Bash
# 這是為了確保下載的安裝檔是官方原廠釋出的
# 建立一個專門用來存放第三方軟體源數位金鑰（GPG Key）的資料夾
sudo install -m 0755 -d /etc/apt/keyrings

# 2. 用 curl 安全地從網際網路下載 Docker 官方的 GPG 金鑰，
#    並透過管道 (|) 傳給 sudo gpg --dearmor，將金鑰轉換成二進位格式，
#    最後儲存 (-o) 到剛剛建立的資料夾中。
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 3. 修改金鑰檔案的權限，加上「可讀取」屬性 (a+r)，
#    確保系統內的所有使用者與套件管理工具（APT）都能讀取這把金鑰。
sudo chmod a+r /etc/apt/keyrings/docker.gpg
```

## 設定 Docker 存放庫 (Repository)

``` Bash
# 將 Docker 的下載來源加入到 apt 清單中：
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

## 正式安裝 Docker 環境
``` Bash
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

## 免 sudo 設定

``` Bash
# 將當前使用者加入 docker 群組
sudo usermod -aG docker $USER

# 立即生效群組設定 (或登出再登入也可以)
newgrp docker
```

# 驗證安裝是否成功
``` Bash
docker --version
docker compose version
```