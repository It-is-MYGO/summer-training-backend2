from django.core.management.base import BaseCommand
from app01.models import Goods
import csv
from datetime import datetime
import re

class Command(BaseCommand):
    help = '从CSV导入商品数据到MySQL（智能分隔符检测）'
    
    def add_arguments(self, parser):
        parser.add_argument('csv_path', type=str, help='CSV文件路径')

    def handle(self, *args, **options):
        file_path = options['csv_path']
        self.import_data(file_path)

    def detect_dialect(self, sample):
        """智能检测分隔符：优先尝试逗号，失败后尝试空格"""
        try:
            dialect = csv.Sniffer().sniff(sample, delimiters=', \t')
            # 验证是否检测到有效的分隔符
            if not dialect.delimiter:
                raise csv.Error
            return dialect
        except csv.Error:
            # 如果标准检测失败，使用自定义逻辑
            if ',' in sample:
                dialect = csv.excel()
                dialect.delimiter = ','
            else:
                dialect = csv.excel()
                dialect.delimiter = ' '
            return dialect

    def import_data(self, file_path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                # 读取样本用于检测分隔符
                sample = f.read(2048)  # 读取更大样本量
                f.seek(0)
                
                # 智能检测分隔符
                try:
                    dialect = self.detect_dialect(sample)
                    reader = csv.DictReader(f, dialect=dialect)
                    self.stdout.write(f"检测到分隔符: '{dialect.delimiter}' (ASCII: {ord(dialect.delimiter)})")
                except Exception as e:
                    self.stderr.write(f"分隔符检测失败: {str(e)}，尝试混合模式解析")
                    return self.fallback_parser(f)
                
                # 验证列名
                required_columns = {
                    'goods_img', 'goods_title', 'goods_price',
                    'goods_sales', 'shop_title', 'shop_platform',
                    'goods_link', 'grab_time'
                }
                
                # 标准化列名（去除前后空格）
                reader.fieldnames = [name.strip() for name in reader.fieldnames]
                
                if not required_columns.issubset(reader.fieldnames):
                    missing = required_columns - set(reader.fieldnames)
                    raise ValueError(f"缺少必要列: {missing}")
                
                total = 0
                batch_size = 100
                objs = []
                
                for row in reader:
                    try:
                        # 处理可能存在的空白列名
                        row = {k.strip(): v for k, v in row.items() if k}
                        
                        objs.append(Goods(
                            goods_img=row['goods_img'].strip(),
                            goods_title=row['goods_title'].strip(),
                            goods_price=float(row['goods_price']),
                            goods_sales=row['goods_sales'].strip(),
                            shop_title=row['shop_title'].strip(),
                            shop_platform=row['shop_platform'].strip(),
                            goods_link=row['goods_link'].strip(),
                            grab_time=datetime.strptime(
                                row['grab_time'].strip(), 
                                '%Y-%m-%d %H:%M'
                            )
                        ))
                        
                        if len(objs) >= batch_size:
                            Goods.objects.bulk_create(objs)
                            total += len(objs)
                            objs = []
                            self.stdout.write(f'已导入 {total} 条...')
                            
                    except Exception as e:
                        self.stderr.write(
                            f"行 {reader.line_num} 错误: {str(e)}\n"
                            f"原始数据: {row}\n"
                            f"分隔符: '{dialect.delimiter}'"
                        )
                        continue
                
                if objs:
                    Goods.objects.bulk_create(objs)
                    total += len(objs)
                
                self.stdout.write(
                    self.style.SUCCESS(f'✅ 成功导入 {total} 条商品数据')
                )
                
        except Exception as e:
            self.stderr.write(
                self.style.ERROR(f'❌ 导入失败: {str(e)}\n'
                               f'建议检查：\n'
                               f'1. 文件编码（尝试utf-8-sig或gbk）\n'
                               f'2. 表头与实际内容的分隔符是否一致')
            )
            if 'f' in locals() and hasattr(f, 'close'): 
                f.close()

    def fallback_parser(self, file_obj):
        """备选解析方案：处理混合分隔符情况"""
        self.stdout.write("尝试使用备选解析器...")
        file_obj.seek(0)
        lines = file_obj.readlines()
        
        # 解析表头（假设用逗号分隔）
        header = [col.strip() for col in lines[0].split(',') if col.strip()]
        
        total = 0
        for i, line in enumerate(lines[1:], 1):
            try:
                # 特殊处理：先按空格分割，再智能重组
                parts = [p.strip() for p in line.split(' ') if p.strip()]
                
                # 重组逻辑（根据您的具体数据结构调整）
                row = {
                    'goods_img': parts[0],
                    'goods_title': ' '.join(parts[1:-7]),
                    'goods_price': parts[-7],
                    'goods_sales': parts[-6],
                    'shop_title': parts[-5],
                    'shop_platform': parts[-4],
                    'goods_link': parts[-3],
                    'grab_time': parts[-2],
                    'page_type': parts[-1] if len(parts) > 8 else ''
                }
                
                Goods.objects.create(
                    goods_img=row['goods_img'],
                    goods_title=row['goods_title'],
                    goods_price=float(row['goods_price']),
                    goods_sales=row['goods_sales'],
                    shop_title=row['shop_title'],
                    shop_platform=row['shop_platform'],
                    goods_link=row['goods_link'],
                    grab_time=datetime.strptime(row['grab_time'], '%Y-%m-%d %H:%M'),
                    page_type=row['page_type']
                )
                total += 1
                
            except Exception as e:
                self.stderr.write(f"行 {i} 备选解析失败: {str(e)}\n数据: {line}")
                continue
                
        self.stdout.write(self.style.SUCCESS(f'备选解析导入 {total} 条数据'))