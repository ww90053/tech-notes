# 步驟
## 建立放置compose檔案需要的資料夾
- 假設要幫postgresql建立資料夾
``` Bach
sudo mkdir -p /docker/postgresql
```
## 設定compose檔案,並上傳到指定路徑
- 產生檔案指令
``` Bach
cd /docker/postgresql
sudo nano docker-compose.yml
```
- 範例請參考: (範例)docker-compose.yml
- 檢查檔案存在,以及權限設定
``` Bach
ls -l /docker/postgresql/docker-compose.yml
# 更改擁有者與群組,擁有者root,群組docker
# 如果想要換成別的帳號當擁有者,可以把root替換掉
sudo chown -R root:docker /docker/postgresql
# 更改權限,擁有者和docker群組都可以存取,其他人只能讀取不能修改
sudo chmod -R 775 /docker/postgresql
```

## 透過compose檔案,啟動docker的postgresql服務
- 確認你在該目錄下，執行啟動指令：
``` Bach
cd /docker/postgresql
sudo docker compose up -d
```
- 檢查運行，基本上未來重新開機也會自動啟動
``` Bach
docker ps
```
## 檢查測試volumes是否設定到正確的資料夾
- 這邊有個地雷,docke compose檔案的rvolumes如果設定錯誤,可能會導致資料丟失
- 假設
	- 範本的設定為 ./data:/var/lib/postgresql/18/docker
	- compose路徑在 /docker/postgresql/docker-compose.yml
- 方法1,確認資料夾有東西
	- 切換到資料夾,ls資料夾
	``` Bach
	# 切換到資料夾
	cd /docker/postgresql
	# 列出子資料夾,應該有個叫做data
	ls
	# 切換到data資料夾
	cd data
	# 可能會看到 bash: cd: data: Permission denied
	# 如果被禁止存取,或者cd進去ls到檔案內容,則代表docker應該有順利連結
	```
- 方法2,直接異動資料庫測試,步驟如下
	- 透過管理工具,登入建立起來的資料庫
	- 隨意寫入資料,或建立資料表或資料庫
	- 卸載compose
	``` Bach
	cd /docker/postgresql
	docker compose down
	```
	- 重新掛載compose
	``` Bach
	docker compose up -d
	```
	- 再次透過資料庫管理工具,登入資料庫,確認剛才異動的內容是否留存