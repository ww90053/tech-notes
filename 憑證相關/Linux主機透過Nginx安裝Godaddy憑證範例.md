# 大致步驟
- 完成DNS域名txt驗證
- Linux主機產生憑證請求檔案
- 透過平台產生憑證相關檔案
- 合併憑證串鍊
- 安裝憑證到Nginx

# DNS TXT紀錄驗證
- 憑證申請程序中,有一段需要證明DNS歸你所有
- 憑證核發單位會寄信給你,提供一組驗證碼,有兩種驗證方法
- A:申請修改DNS TXT設定,註冊上述驗證碼
- B:架設一個http 80 port網站,把文字檔案放在指定路徑
	- \.well-known\pki-validation\godaddy.html
	- html檔案就當作純文字檔,放驗證碼文字,不要放其他任何標籤
- 上述擇一完成之後,再跟憑證核發單位完成驗證

# Linux主機產生憑證請求檔案
- 建立存放 SSL 的目錄
```bash
# 1. 建立資料夾（-p 確保上層目錄存在時不報錯）
sudo mkdir -p /etc/nginx/ssl
# 2. 將擁有者與群組設為 root
sudo chown -R root:root /etc/nginx/ssl
# 3. 設定目錄權限
sudo chmod 755 /etc/nginx/ssl
```
- 登入你的 Nginx 伺服器，切換到存放 SSL 的目錄（例如 /etc/nginx/ssl，如果沒有可自行建立），執行：
```bash
cd /etc/nginx/ssl
sudo openssl req -new -newkey rsa:2048 -nodes -keyout cms.pcm2000.com.tw.key -out cms.pcm2000.com.tw.csr
```
- 填寫資訊
```
請依序填入以下內容（每填完一項按一次 Enter）：
Country Name (2 letter code)：TW
State or Province Name (full name)：Taiwan（或填城市如 Taipei）
Locality Name (eg, city)：Taipei（直接填所屬縣市）
Organization Name (eg, company)：填入公司名稱（例如英文公司名，或直接填 PCM2000）
Organizational Unit Name (eg, section)：部門名稱，通常直接按 Enter 留空
Common Name (e.g. server FQDN or YOUR name)：
cms.pcm2000.com.tw（極重要，一定要填寫完整網域名稱，不能有多餘空白）
Email Address：管理員信箱，可填寫或直接按 Enter 留空

額外提示（Extra Attributes）
在填完 Email 之後，系統可能會接著詢問：
A challenge password []:
An optional company name []:
這兩項直接按 Enter 留空即可，不要設定密碼，否則每次 Nginx 重開機都會要求輸入密碼。
```
- 完成後，/etc/nginx/ssl目錄下就會順利產出
	- cms.pcm2000.com.tw.key（私鑰）	
		- 如果產生請求的主機和未來安裝憑證的主機不同一台,key檔案請另外儲存
	- cms.pcm2000.com.tw.csr（請求檔）
		- 拿請求檔GoDaddy平台的申請步驟

# GoDaddy平台產生的憑證檔案
- 憑證核發成功之後,下載憑證的時候,選擇伺服器為Nginx,會拿到一包壓縮檔案
- cms.pcm2000.com.tw-certificate.crt
- cms.pcm2000.com.tw-certificate.pem
	- 都是憑證的本體,兩者檔案其實都一樣,只是副檔名不同
- cms.pcm2000.com.tw-intermediate.pem
	- 中繼憑證
- cms.pcm2000.com.tw-root.pem
	- 根憑證,實際測試並不會需要用到,因為現代瀏覽器其實會註冊這家的根憑證
- cms.pcm2000.com.tw-cross.pem
	- 是「交叉簽署憑證」（Cross-Certificate / Cross-Root Certificate），主要用途是為了相容舊版作業系統與舊裝置。
	- 實際測試之後,Chrome瀏覽器仍然會需要使用它。

# 合併憑證串鍊
- 預計產出物:cms.pcm2000.com.tw-bundle.crt
- 方法A:
	- 用記事本建立新檔案 cms.pcm2000.com.tw-bundle.crt
	- 把以下檔案依序貼上內容到上述檔案
		- cms.pcm2000.com.tw-certificate.crt
		- cms.pcm2000.com.tw-intermediate.pem
		- cms.pcm2000.com.tw-cross.pem
- 方法B:
	-windows指令
```cmd
type cms.pcm2000.com.tw-certificate.crt > cms.pcm2000.com.tw-bundle.crt
echo. >> cms.pcm2000.com.tw-bundle.crt
type cms.pcm2000.com.tw-intermediate.pem >> cms.pcm2000.com.tw-bundle.crt
echo. >> cms.pcm2000.com.tw-bundle.crt
type cms.pcm2000.com.tw-cross.pem >> cms.pcm2000.com.tw-bundle.crt
```

# 安裝憑證到Nginx
- 假設過程中產生的.key檔案是保留在/etc/nginx/ssl/cms.pcm2000.com.tw.key
- 先上傳憑證檔案路徑 /etc/nginx/ssl/cms.pcm2000.com.tw-bundle.crt
- 檢查憑證是否正確,若格式有問題會報錯
```bash
sudo nginx -t
```
- 去 /etc/nginx/sites-available 修改網站的設定
	- 本次是: /etc/nginx/sites-available/website1
- 追加以下設定
```config
server {
	# 監聽的port和協定
    listen 80;
	# (追加)https 443
    listen 443 ssl http2;
	# 如果有網域請填網域，沒有就維持 _ (代表監聽所有 IP)
    server_name _; 
	# (追加)設定憑證和key路徑
	ssl_certificate /etc/nginx/ssl/cms.pcm2000.com.tw-bundle.crt;
    ssl_certificate_key /etc/nginx/ssl/cms.pcm2000.com.tw.key;
```
- 最後重啟nginx服務
```bash
sudo systemctl reload nginx
```