import csv

input_file = 'suning_products.csv'
output_file = 'suning_products_fixed.csv'

# 读取原始CSV
with open(input_file, 'r', encoding='utf-8') as f:
    lines = [line for line in f if line.strip()]  # 去除空行

# 处理表头
header = lines[0].replace('"', '').strip()
header_fields = [h.strip() for h in header.split(',')]
num_fields = len(header_fields)

# 处理数据行
data_rows = []
for line in lines[1:]:
    # 用csv.reader处理，自动处理引号、逗号等
    for row in csv.reader([line]):
        # 补齐或截断字段
        if len(row) < num_fields:
            row += [''] * (num_fields - len(row))
        elif len(row) > num_fields:
            row = row[:num_fields]
        data_rows.append(row)

# 写入新CSV
with open(output_file, 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f, quoting=csv.QUOTE_ALL)
    writer.writerow(header_fields)
    writer.writerows(data_rows)

print(f'已生成标准化CSV文件：{output_file}')