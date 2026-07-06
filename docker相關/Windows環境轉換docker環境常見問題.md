# 1. 狀態與資料失蹤：容器重啟後資料全沒了 (Stateless 思維)

* 傳統 Windows 習慣：網站寫入的 Log 檔案、上傳的圖片，或是 .NET 的 Session、加密金鑰 (Data Protection Keys)，都直接存在 Windows 伺服器的 C 碟或 D 碟。就算 IIS 重新啟動，檔案依然完好如初。
* Docker 痛點：Docker 容器是「隨用隨丟 (Stateless)」的。每一次更新程式、執行 `docker compose down && up`，或是容器因故重啟，容器內部的檔案系統就會徹底被初始化（還原到 Image 最初的狀態）。這會導致：
    * 上傳的檔案、本機資料庫檔案全部消失。
    * ASP.NET Core 的 Data Protection 金鑰被洗掉，導致原本登入的使用者 Cookie/Session 突然全部失效被迫登出。

* 解決方案：
    * 持久化資料*：必須使用 `volumes` (資料卷) 將容器內的路徑掛載到宿主機 (Host) 的實體路徑上（例如：把容器內的 Log 或上傳資料夾對應到主機的實體目錄）。
    * 金鑰與 Session 共享*：將 Data Protection 金鑰指定儲存至掛載的實體路徑，或改用 Redis 來管理 Session 狀態。



# 2. 連接埠衝突與反向代理 (Port Allocation)

* 傳統 Windows 習慣：在 IIS 中，我們習慣建立多個網站，並透過「主機標頭 (Host Headers / Bindings)」功能，讓所有網站都去聽實體的 80 或 443 埠，由 IIS 幫我們依照網域分流。
* Docker 痛點：在 Linux/Docker 環境中，一個實體連接埠（如 80 Port）同一時間*只能綁定給一個容器或程式*。如果你想開第二個網站容器又試圖對應到主機的 80 Port，就會直接噴出 `port is already allocated` 的錯誤。
* 解決方案（網關單一窗口制）：
    * 不讓各個網站直接佔用主機的 80/443 Port，而是只架設一個Nginx 或 Traefik 容器作為反向代理的「總窗口」，負責監聽主機的 80/443 Port。
    * 其他網站容器（如 Web1, Web2）則隱藏在後端的「共享 Docker 網路」中，由這個 Nginx 總窗口依據網域（Domain）進行流量分流。



# 3. 排查問題困難：找不到「事件檢視器」與檔案 Log

* 傳統 Windows 習慣：網站出錯時，直覺會去翻 Windows 事件檢視器（Event Viewer），或者用遠端桌面（RDP）連進伺服器，用點擊的方式打開特定資料夾看文字檔。
* Docker 痛點：Docker 容器內部通常是極簡的 Linux 環境，沒有圖形介面，也沒有 Windows 事件檢視器。
* 解決方案：
    * 標準輸出 (stdout)：在 Docker 的世界裡，程式的 Log 應該直接輸出到主控台（Console）。維運人員會透過 `docker logs -f <container_id>` 指令來即時動態追蹤（Tail）網站的錯誤紀錄。
    * GUI 工具輔助：在開發端，可以善用 Visual Studio / VS Code 的 Docker 套件，或 Docker Desktop 的圖形介面，這能讓習慣滑鼠操作的人輕鬆查看 Log、操作容器。


# 4. 資源分配與環境限制 (記憶體與效能)

*傳統 Windows 習慣*：在實體機或大型 VM 上架站，Windows 服務或 SQL Server 會自動調配、佔用整台機器的資源。
*Docker 痛點*：當在同一台伺服器上用 Docker 塞了多個服務（例如同時跑 Web、Redis、SQL Server 容器）時，若沒有做好限制，容易互相擠壓資源。例如SQL Server 容器*在執行複雜查詢時，如果主機記憶體被壓榨殆盡，就會拋出 `SqlException: 資源集區 'internal' 中的系統記憶體不足` 的 500 錯誤，進而導致整個網站崩潰。
*解決方案*：
* 在部署容器（特別是資料庫）時，應在 `docker-compose.yml` 中或透過環境變數（如 `SA_PASSWORD`、記憶體限制參數）合理設定容器的資源上限（Resource Limits），避免單一容器崩潰拖垮整台伺服器。

# 5. 檔案路徑與大小寫敏感問題 (Windows vs Linux)

* 傳統 Windows 習慣*：Windows 作業系統對路徑是不區分大小寫的（`C:\ABC\test.txt` 和 `c:\abc\Test.txt` 是同一個檔案），且路徑分隔記號使用反斜線 `\`。
* Docker 痛點*：由於絕大多數 Docker 容器內部都是 Linux 系統，*Linux 對於大小寫極度敏感*。此外，Docker 機制中的設定檔（如 `.dockerignore`）路徑必須嚴格遵循 Linux 的正斜線 `/` 規範。
* 如果在 `.dockerignore` 裡寫了 Windows 習慣的 `bin\`，Docker 在 Build 的時候就會因為無法識別轉義字元而報錯 `failed to solve: syntax error in pattern`。
* 如果程式碼內寫死了特定實體路徑或大小寫不一致，搬到容器內就會直接發生「找不到檔案」的錯誤。


* 解決方案*：
    * 撰寫程式碼與 Docker 設定檔時，全面改用跨平台相容的相對路徑與正斜線 `/`。
    * 嚴格檢查程式中引用檔案的大小寫是否與實體檔案完全一致。


# 6. 時區與時間落差 (Timezone)

* 傳統 Windows 習慣*：Windows 伺服器設定在台北時間（GMT+8），網站程式抓到的 `DateTime.Now` 自然就是台灣時間。
* Docker 痛點*：不論你的 Windows/Ubuntu 主機時間設為什麼，*Docker 容器內部的基礎鏡像（Base Image）預設一律是世界協調時間 (UTC)*。如果直接把網站封裝進去，會發現訂單時間、Log 記錄時間全都慢了 8 個小時。
* 解決方案*：
    * 不需要去修改主機的實體檔案，最佳的做法是在啟動容器時（不論是單機 Docker 還是未來的 K8S），透過環境變數注入 `TZ=Asia/Taipei`，Linux 核心就會自動將容器內的時間切換為台北時間，達到程式與環境的解耦。

