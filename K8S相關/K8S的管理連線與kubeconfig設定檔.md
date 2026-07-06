# 說明
- K8S管理者的連線方法比較特殊,需要仰賴PC端定義好kubeconfig檔案,才能透過kubectl指令連線到K8S環境
- 換言之,連線方法並非傳統的:IP Address/URL/帳號/密碼,這種模式

# kubeconfig檔案的位置
- Windows
	- C:\Users\<你的文字使用者名稱>\.kube\config
	- 補充:如果安裝docker desktop 的k8s cluster,則會自動建立上述檔案
- Linux
	- /home/<你的使用者名稱>/.kube/config
- 使用環境變數 KUBECONFIG
	- 如果你設定了 KUBECONFIG 環境變數，kubectl 就會放棄去讀取上面提到的預設路徑，改去讀取你指定的路徑：
	- Windows (cmd): set KUBECONFIG=C:\path\to\your\config
	- Windows (PowerShell): $env:KUBECONFIG="C:\path\to\your\config"
	- Linux / macOS: export KUBECONFIG=~/.kube/your-custom-config
# kubeconfig檔案能否定義多組以上的K8S連線
- 理論上可以,但過程會稍微麻煩,設定值中的資訊其實可以合併
```
apiVersion: v1
kind: Config
preferences: {}

# 1. 定義所有的目的地 (地圖)
clusters:
- cluster:
    server: https://192.168.1.100:6443
    certificate-authority-data: ...
  name: local-dev-cluster
- cluster:
    server: https://172.16.110.125:8443
    certificate-authority-data: ...
  name: coworker-remote-cluster

# 2. 定義所有的通行證 (身分)
users:
- user:
    client-certificate-data: ...
  name: tom-local-user
- user:
    client-certificate-data: ...
  name: kubernetes-admin

# 3. 定義連線組合快捷鍵 (最關鍵！名稱不能重覆)
contexts:
- context:
    cluster: local-dev-cluster
    user: tom-local-user
  name: ctx-my-local       # 這是你在 OpenLens 看到的按鈕，或是 cmd 切換的名字
- context:
    cluster: coworker-remote-cluster
    user: kubernetes-admin
  name: ctx-coworker-remote # 另一個環境的識別名

# 4. 目前預設開啟哪一個環境
current-context: ctx-my-local
```
- 如果嫌麻煩,也是可以保留兩組不同cluster,然後手動複製貼上設定值