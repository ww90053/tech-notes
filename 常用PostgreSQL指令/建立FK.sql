
--與FK目標資料表之間,沒有從屬關係,建議採用此版本

-- 為 project 表的 company_code 欄位建立外鍵約束
ALTER TABLE public.project
ADD CONSTRAINT fk_project_company 
FOREIGN KEY (company_code) 
REFERENCES public.company(code)
--更新PK連動
ON UPDATE CASCADE
--被使用時不允許刪除,沒有從屬關係的資料建議如此,有從屬關係的資料則建議CASCADE連動
ON DELETE RESTRICT;


--本資料表隸屬於FK目標資料表,建議採用此版本

-- 為 project 表的 company_code 欄位建立外鍵約束
ALTER TABLE public.project
ADD CONSTRAINT fk_project_company 
FOREIGN KEY (company_code) 
REFERENCES public.company(code)
--更新PK連動
ON UPDATE CASCADE
--如果FK目標資料被刪除,則本資料也一併刪除
ON DELETE CASCADE;