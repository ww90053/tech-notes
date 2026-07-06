--所有資料表
SELECT 
    n.nspname AS "NameSpace",
    c.relname AS "資料表名稱",
    obj_description(c.oid, 'pg_class') AS "資料表備註"
FROM 
    pg_class c
JOIN 
    pg_namespace n ON n.oid = c.relnamespace
WHERE 
    c.relkind = 'r' -- r 代表普通資料表 (ordinary table)
    AND n.nspname NOT IN ('information_schema', 'pg_catalog') -- 排除系統內建表
ORDER BY 
    n.nspname, c.relname;

--所有欄位
SELECT 
    cols.table_name AS "資料表名稱",
    cols.column_name AS "欄位名稱",
    cols.udt_name AS "變數型態",
    cols.character_maximum_length AS "長度限制",
    (
        SELECT pg_catalog.col_description(c.oid, cols.ordinal_position::int)
        FROM pg_catalog.pg_class c
        WHERE c.relname = cols.table_name
    ) AS "備註"
FROM 
    information_schema.columns cols
WHERE 
    cols.table_schema = 'public' 
    AND cols.table_name = 'project' -- 這裡可以換成您的資料表名稱
ORDER BY 
    cols.table_name, cols.ordinal_position;
