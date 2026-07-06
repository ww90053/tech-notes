在 Kubernetes (K8S) 環境中架設與維運網站，核心思維是從單機的「命令式」轉變為「宣告式」：您需要先撰寫好一張 YAML 宣告清單（通常包含定義容器如何運行的 Deployment，以及負責網路流量導向與負載均衡的 Service）。

以下結合您上傳的維運教學檔案，為您整理在 K8S 環境中從「環境驗證、網站部署、狀態查閱」到「後續更新與除錯」的**具體實用指令碼（Cheat Sheet）**：

### 一、 環境檢查與叢集切換（部署前準備）

在下達任何部署指令前，必須先確保您的命令列（CMD 或 PowerShell）已經成功連上並瞄準正確的 K8S 叢集。

* **檢查目前連線的 K8S 叢集身分（Context）：**
```bash
kubectl config current-context

```


*(如果您是在個人 PC 端使用 Docker Desktop 架設 K8S，請確認目前的 Context 輸出為 `docker-desktop`)*
* **驗證叢集節點（Node）狀態是否正常：**
```bash
kubectl get nodes

```


*(當看到本機節點的狀態顯示為 `Ready` 時，代表您的個人 K8S 叢集已成功誕生並就緒)*

---

### 二、 部署網站（核心套用指令）

請先將終端機切換至放有 K8S 資源宣告清單（例如 `k8s-web-deploy.yaml` 或 `deployment.yaml`）的專案目錄下。

* **發布/套用設定檔至 K8S：**
```bash
kubectl apply -f k8s-web-deploy.yaml

```


*(此指令會將您的設定宣告發送給 K8S，讓系統開始自動建立對應的網站容器與網路通道)*
* **如果您的設定檔將 Deployment（管容器）與 Service（管網路）拆分為獨立檔案，也可以依序套用：**
```bash
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml

```


* **若網站部署在特定的命名空間（Namespace，例如 `icc-prod`），可在指令後方加上 `-n` 參數指定（若 YAML 內已寫明則可省略）：**
```bash
kubectl apply -f k8s-web-deploy.yaml -n icc-prod

```



---

### 三、 查看與驗證網站狀態

部署指令下達後，需要大約幾秒鐘的時間讓 K8S 去調度資源、檢查本機鏡像或拉取 Image，並將容器建立起來。

* **查看應用程式容器（Pod）的運行狀態：**
```bash
kubectl get pods

```


*(請確認您網站 Pod 的 STATUS 欄位是否成功轉為 `Running`)*
* **查看 Deployment 控制器狀態：**
```bash
kubectl get deployment

```


*(用以確認目前容器的副本數量（Replicas）與維護狀態是否符合宣告目標)*
* **查看 Service 網路通道與 Port 對應：**
```bash
kubectl get service

```


*(用以確認 Service 聽取的 Port 以及流量是如何平均分配給後端網頁容器的)*
* **💡 跨 Namespace 查閱重要提醒：** 如果您的網站是部署在特定環境（如 `icc-prod`），上述查看狀態的指令皆**必須**在結尾加上 `-n <名稱>`，否則 K8S 預設只會查詢 `default` 空間，會導致您看不到任何資料：
```bash
kubectl get pods -n icc-prod
kubectl get service -n icc-prod

```



---

### 四、 日誌調閱與除錯（維運必備）

當網站發生異常（例如噴出 500 錯誤、資料庫記憶體不足等問題）需要排查時，K8S 環境下無法直接使用單機的 `docker logs`，必須指定具體的 Pod 名稱。

* **檢視特定網站 Pod 的 Log 紀錄：**
```bash
kubectl logs <您的-Pod-名稱>

```


*()*
* **即時動態追蹤 Log（如同觀看即時動態直播）：**
```bash
kubectl logs -f <您的-Pod-名稱>

```


*(加上 `-f` 參數，只要網頁一有被瀏覽或程式碼噴出錯誤，終端機畫面就會即時刷新顯示最新日誌)*
* **若位於特定的命名空間，同樣需加上 `-n` 參數：**
```bash
kubectl logs -f <您的-Pod-名稱> -n icc-prod

```



---

### 五、 網站更新（程式碼更新後的重啟策略）

當您的程式碼有了更新，您在本機重新執行了 `docker build` 打包出新映像檔，在不變動 Image Tag（例如同樣維持 `:latest`，且 YAML 內設定為 `imagePullPolicy: IfNotPresent`）的情況下，K8S 預設不會主動去汰換正在運行中的 Pod。

* **強制讓該服務進行重啟並載入新映像檔的指令：**
```bash
kubectl rollout restart deployment/<您的-Deployment-名稱>

```


*()*
* **若位於特定的 Namespace：**
```bash
kubectl rollout restart deployment/<您的-Deployment-名稱> -n icc-prod

```


* **💡 滾動更新（Rolling Update）優勢：** 執行此重啟指令後，K8S 會非常優雅地先開啟擁有新程式碼的新容器，確認健康檢查通過、正式上線聽取流量後，才會回頭把舊版容器刪除。這種機制能確保網站在更新程式碼的過程中達到零中斷、無縫銜接（Zero Downtime）的完美維運狀態。