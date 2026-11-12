# SQL Server 資料庫與實體檔案改名作業手冊（SOP）

本手冊說明如何將已還原或測試完成的 SQL Server 資料庫（例如 `IoTDB_restored_20261109`），在不重新備份還原的前提下，無縫修改其**資料庫名稱**、**實體檔案名稱（`.mdf` / `.ldf`）**以及**內部邏輯檔案名稱（Logical Name）**，正式切換回 `IoTDB`。

---

## 前置檢查注意事項

1. **確認目標名稱未被佔用：** 執行前請確認 SQL Server 執行個體中已無名為 `IoTDB` 的資料庫（若舊庫仍在，請先將舊庫離線、改名或移除）。
2. **確認實體路徑無同名檔案：** 確認目標資料夾（如 `D:\MSSQL\DATA\`）中，原本舊的 `IoTDB.mdf` 與 `IoTDB_log.ldf` 已經備份移走或改名，以免在 Windows 改名時發生檔案衝突。
3. **停止相關應用程式連線：** 切換期間會將資料庫設為單人模式並離線（Offline），請先暫停連接該資料庫的服務或排程。

---

## 完整改名操作步驟

### 步驟 1：查詢目前的邏輯檔案名稱（Logical Name）

開啟 SSMS 並執行以下查詢，取得該資料庫內部的邏輯檔名與目前實體路徑：

```sql
USE [IoTDB_restored_20261109];
GO

SELECT 
    name AS LogicalName, 
    physical_name AS PhysicalPath, 
    type_desc AS FileType
FROM sys.database_files;
```

> **記錄重點：** 請記下查詢結果中的兩個 `LogicalName`（分別對應 `ROWS` 資料檔與 `LOG` 記錄檔），後續步驟 2 與步驟 4 會用到。

---

### 步驟 2：中斷連線、資料庫離線並修改系統目錄路徑

在修改 Windows 實體檔名之前，必須先讓資料庫離線以釋放檔案鎖定，並預先在 SQL Server 系統目錄中將路徑指向未來的 `IoTDB.mdf` 與 `IoTDB_log.ldf`：

```sql
USE [master];
GO

-- 1. 強制中斷現有連線，將資料庫切換為單人模式
ALTER DATABASE [IoTDB_restored_20261109] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
GO

-- 2. 將資料庫設為離線（Offline）以釋放實體檔案鎖定
ALTER DATABASE [IoTDB_restored_20261109] SET OFFLINE;
GO

-- 3. 修改系統目錄中的實體檔案路徑（請替換為步驟 1 查出的 LogicalName）
ALTER DATABASE [IoTDB_restored_20261109] 
MODIFY FILE (
    NAME = N'填入資料檔的LogicalName', 
    FILENAME = N'D:\MSSQL\DATA\IoTDB.mdf'
);

ALTER DATABASE [IoTDB_restored_20261109] 
MODIFY FILE (
    NAME = N'填入記錄檔的LogicalName', 
    FILENAME = N'D:\MSSQL\DATA\IoTDB_log.ldf'
);
GO
```

---

### 步驟 3：在 Windows 檔案總管修改實體檔名

前往 `D:\MSSQL\DATA\` 資料夾，手動將兩個檔案重新命名（需與步驟 2 設定的 `FILENAME` 完全一致）：

* `IoTDB_restored_20261109.mdf` $\rightarrow$ **`IoTDB.mdf`**
* `IoTDB_restored_20261109_log.ldf` $\rightarrow$ **`IoTDB_log.ldf`**

---

### 步驟 4：資料庫重新上線並改回正式名稱

實體檔名修改完成後，回到 SSMS 執行以下語法，讓資料庫重新掛載並改回正式名稱：

```sql
USE [master];
GO

-- 1. 將資料庫重新上線（系統會自動掛載改名後的 IoTDB.mdf 與 IoTDB_log.ldf）
ALTER DATABASE [IoTDB_restored_20261109] SET ONLINE;
GO

-- 2. 將資料庫名稱（Database Name）改回 IoTDB
ALTER DATABASE [IoTDB_restored_20261109] MODIFY NAME = [IoTDB];
GO

-- 3. 恢復為多人連線模式（Multi-User）
ALTER DATABASE [IoTDB] SET MULTI_USER;
GO
```

---

### 步驟 5：（選用）修改內部邏輯檔案名稱

若希望連資料庫內部的邏輯檔名（Logical Name）也一併整理為標準的 `IoTDB` 與 `IoTDB_log`（不影響連線字串，純粹為了管理整潔），可執行以下指令（此步驟不需離線即可執行）：

```sql
USE [master];
GO

ALTER DATABASE [IoTDB] 
MODIFY FILE (NAME = N'填入原本資料檔的LogicalName', NEWNAME = N'IoTDB');

ALTER DATABASE [IoTDB] 
MODIFY FILE (NAME = N'填入原本記錄檔的LogicalName', NEWNAME = N'IoTDB_log');
GO
```

---

## 改名後驗證檢查

執行以下查詢，確認資料庫狀態為 `ONLINE`、模式為 `MULTI_USER`，且邏輯名稱與實體路徑皆已正確更新：

```sql
SELECT 
    d.name AS DatabaseName,
    d.state_desc AS State,
    d.user_access_desc AS UserAccess,
    mf.name AS LogicalName,
    mf.physical_name AS PhysicalPath
FROM sys.databases d
JOIN sys.master_files mf ON d.database_id = mf.database_id
WHERE d.name = N'IoTDB';
```

---

## 💡 未來預防技巧：還原時使用獨立子資料夾

若未來有類似「先還原測試、日後轉正式」的需求，建議在還原階段直接建立獨立的子資料夾（例如 `D:\MSSQL\DATA\Restored_20261109\`）。因為資料夾路徑不同，還原當下就能直接沿用 `IoTDB.mdf` 與 `IoTDB_log.ldf` 作為實體檔名，日後轉正式時只需移除舊庫並執行 `ALTER DATABASE ... MODIFY NAME = [IoTDB]` 即可，能省去步驟 2 與步驟 3 的實體檔改名作業。