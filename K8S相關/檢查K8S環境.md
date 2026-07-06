# 檢查目前瞄準的叢集身分：

```Bash
kubectl config current-context
```
- 🎯 正確回應：應該要出現 docker-desktop。如果出現這個，代表你的指令方向完全正確。

# 查看整個叢集的詳細連線資訊：
```Bash
kubectl cluster-info
```
- 🎯 正確回應：會看到幾行綠色或白色的文字。
```
Kubernetes control plane is running at https://127.0.0.1:56638
CoreDNS is running at https://127.0.0.1:56638/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy

To further debug and diagnose cluster problems, use 'kubectl cluster-info dump'.
```

- ❌ 異常警訊：如果卡住很久，或是噴出 Unable to connect to the server: dial tcp...，代表 K8S 核心雖然在 Docker Desktop 顯示 Ready，但通訊管道還沒打通。