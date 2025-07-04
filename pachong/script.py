import os
import django

# 设置 Django 环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pachong.settings')
django.setup()

from django.db import connection

def get_table_structure():
    """获取数据库表结构"""
    with connection.cursor() as cursor:
        # 获取所有表
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        
        print("数据库中的所有表:")
        for table in tables:
            print(f"- {table[0]}")
        
        print("\n" + "="*50)
        
        # 获取 app01_goods 表的结构
        cursor.execute("DESCRIBE app01_goods")
        columns = cursor.fetchall()
        
        print("app01_goods 表结构:")
        print(f"{'字段名':<20} {'类型':<20} {'是否为空':<10} {'键':<10} {'默认值':<15} {'额外信息'}")
        print("-" * 80)
        
        for column in columns:
            field_name, field_type, null, key, default, extra = column
            print(f"{field_name:<20} {field_type:<20} {null:<10} {key:<10} {str(default):<15} {extra}")
        
        return columns

def generate_model_fields(columns):
    """根据数据库表结构生成 Django 模型字段"""
    print("\n" + "="*50)
    print("生成的 Django 模型字段:")
    print("="*50)
    
    field_mappings = {
        'int': 'models.IntegerField',
        'bigint': 'models.BigIntegerField',
        'varchar': 'models.CharField',
        'text': 'models.TextField',
        'datetime': 'models.DateTimeField',
        'date': 'models.DateField',
        'decimal': 'models.DecimalField',
        'float': 'models.FloatField',
        'boolean': 'models.BooleanField',
        'timestamp': 'models.DateTimeField',
    }
    
    for column in columns:
        field_name, field_type, null, key, default, extra = column
        
        # 跳过 id 字段（Django 自动生成）
        if field_name == 'id':
            continue
            
        # 解析字段类型
        field_type_lower = field_type.lower()
        django_field = None
        
        if 'varchar' in field_type_lower:
            # 提取长度
            length = field_type_lower.split('(')[1].split(')')[0]
            django_field = f"models.CharField(verbose_name='{field_name}', max_length={length})"
        elif 'int' in field_type_lower:
            if 'bigint' in field_type_lower:
                django_field = f"models.BigIntegerField(verbose_name='{field_name}')"
            else:
                django_field = f"models.IntegerField(verbose_name='{field_name}')"
        elif 'decimal' in field_type_lower:
            # 提取精度和小数位数
            precision = field_type_lower.split('(')[1].split(',')[0]
            decimal_places = field_type_lower.split(',')[1].split(')')[0]
            django_field = f"models.DecimalField(verbose_name='{field_name}', max_digits={precision}, decimal_places={decimal_places})"
        elif 'datetime' in field_type_lower:
            django_field = f"models.DateTimeField(verbose_name='{field_name}')"
        elif 'text' in field_type_lower:
            django_field = f"models.TextField(verbose_name='{field_name}')"
        elif 'timestamp' in field_type_lower:
            django_field = f"models.DateTimeField(verbose_name='{field_name}')"
        else:
            django_field = f"models.CharField(verbose_name='{field_name}', max_length=255)  # 未知类型，使用默认"
        
        # 处理是否为空
        if null == 'NO':
            django_field = django_field.replace(')', ', null=False)')
        else:
            django_field = django_field.replace(')', ', null=True)')
        
        # 处理默认值
        if default is not None and default != 'NULL':
            if isinstance(default, str) and not default.isdigit():
                django_field = django_field.replace(')', f", default='{default}')")
            else:
                django_field = django_field.replace(')', f", default={default})")
        
        print(f"    {field_name} = {django_field}")

def generate_complete_model(columns):
    """生成完整的模型代码"""
    print("\n" + "="*50)
    print("完整的 Django 模型代码:")
    print("="*50)
    
    print("from django.db import models")
    print()
    print("class Goods(models.Model):")
    print('    """商品表"""')
    
    for column in columns:
        field_name, field_type, null, key, default, extra = column
        
        # 跳过 id 字段
        if field_name == 'id':
            continue
            
        # 生成字段
        field_type_lower = field_type.lower()
        
        if 'varchar' in field_type_lower:
            length = field_type_lower.split('(')[1].split(')')[0]
            print(f"    {field_name} = models.CharField(verbose_name='{field_name}', max_length={length})")
        elif 'int' in field_type_lower:
            if 'bigint' in field_type_lower:
                print(f"    {field_name} = models.BigIntegerField(verbose_name='{field_name}')")
            else:
                print(f"    {field_name} = models.IntegerField(verbose_name='{field_name}')")
        elif 'decimal' in field_type_lower:
            precision = field_type_lower.split('(')[1].split(',')[0]
            decimal_places = field_type_lower.split(',')[1].split(')')[0]
            print(f"    {field_name} = models.DecimalField(verbose_name='{field_name}', max_digits={precision}, decimal_places={decimal_places})")
        elif 'datetime' in field_type_lower:
            print(f"    {field_name} = models.DateTimeField(verbose_name='{field_name}')")
        elif 'text' in field_type_lower:
            print(f"    {field_name} = models.TextField(verbose_name='{field_name}')")
        elif 'timestamp' in field_type_lower:
            print(f"    {field_name} = models.DateTimeField(verbose_name='{field_name}')")
        else:
            print(f"    {field_name} = models.CharField(verbose_name='{field_name}', max_length=255)")
    
    print()
    print("    class Meta:")
    print("        db_table = 'app01_goods'")
    print()
    print("    def __str__(self):")
    print("        return self.goods_title")

if __name__ == "__main__":
    try:
        columns = get_table_structure()
        generate_model_fields(columns)
        generate_complete_model(columns)
    except Exception as e:
        print(f"错误: {e}")
        print("请确保数据库连接正常，并且 app01_goods 表存在")