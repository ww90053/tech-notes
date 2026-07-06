rem 切到當前資料夾
cd /d "%~dp0"
rem 更新模型
dotnet ef dbcontext scaffold "Server=172.16.110.138;Port=5432;Database=contractor_system;User ID=iscom;Password=7o598966;Pooling=true;" Npgsql.EntityFrameworkCore.PostgreSQL --output-dir "Models\DB" --context "DBContext" --no-pluralize --use-database-names --data-annotations --force --no-onconfiguring