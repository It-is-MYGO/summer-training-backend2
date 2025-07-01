<template>
  <section class="page-content">
    <div class="container">
      <h2 class="section-title">我的收藏夹</h2>
      <div class="favorites-container">
        <div class="favorites-grid">
          <div
            class="favorite-item"
            v-for="item in favorites"
            :key="item.id"
            @click="goToProduct(item.product_id)"
            style="cursor:pointer;"
          >
            <div class="favorite-image">
              <img :src="item.img || item.image || defaultImg" :alt="item.title" @error="onImgError" />
            </div>
            <div class="favorite-info">
              <h3>{{ item.title }}</h3>
              <div class="favorite-price">{{ item.price }}</div>
              <div :class="['price-change', item.priceChange > 0 ? 'price-up' : 'price-down']">
                {{ item.priceChange > 0 ? '涨' : '降' }} {{ Math.abs(item.priceChange) }}
              </div>
              <div class="alert-setting">
                <span>提醒价：</span>
                <input 
                  type="number" 
                  v-model="item.alertPrice" 
                  style="width: 100px;" 
                  @click.stop 
                  @blur="updateAlertPrice(item.id, item.alertPrice)"
                />
                <span>元时通知我</span>
              </div>
              <button class="btn btn-outline" @click.stop="removeFromFavorites(item.id)">取消收藏</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const favorites = ref([])
const router = useRouter()
const user = JSON.parse(localStorage.getItem('user') || '{}')
const userId = user && user.id
const defaultImg = '/default-product.png'

function onImgError(e) {
  e.target.src = defaultImg
}

async function fetchFavorites() {
  console.log('收藏夹数据:', favorites.value)
  if (!userId) {
    router.push('/login')
    return
  }
  const res = await fetch(`/api/favorites?userId=${userId}`)
  favorites.value = await res.json()
}

onMounted(fetchFavorites)

// 🔧 修复：统一路由路径，与首页保持一致
function goToProduct(productId) {
  console.log('跳转商品id:', productId)
  if (!productId) return
  // 修改前：router.push(`/detail/${productId}`)
  // 修改后：使用与首页一致的路由
  router.push(`/product/${productId}`)
}

// 🔧 修复：添加提醒价格更新功能
async function updateAlertPrice(favoriteId, alertPrice) {
  if (!favoriteId || !alertPrice || alertPrice <= 0) {
    console.log('提醒价格无效，跳过更新')
    return
  }
  
  try {
    // 使用兼容路径，支持新旧两种API
    const res = await fetch(`/api/favorites/${favoriteId}/alert`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ alertPrice: alertPrice })
    })
    
    if (res.ok) {
      console.log('提醒价格更新成功')
      // 可选：显示成功提示
      // alert('提醒价格设置成功！')
    } else {
      console.error('提醒价格更新失败:', res.statusText)
      alert('提醒价格设置失败，请重试')
    }
  } catch (error) {
    console.error('更新提醒价格时出错:', error)
    alert('设置提醒价格失败，请检查网络连接')
  }
}

async function removeFromFavorites(favoriteId) {
  if (!favoriteId) {
    alert('参数有误')
    return
  }
  const res = await fetch(`/api/favorites/${favoriteId}`, { method: 'DELETE' })
  if (res.ok) {
    await fetchFavorites()
    alert('已取消收藏')
  } else {
    const data = await res.json()
    alert(data.message || '取消收藏失败')
  }
}
</script>

<style scoped>
.page-content {
  padding: 30px 0;
}
.section-title {
  font-size: 1.8rem;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid var(--light-gray);
  color: var(--primary);
}
.favorites-container {
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.05);
}
.favorites-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 20px;
}
.favorite-item {
  display: flex;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid var(--light-gray);
}
.favorite-image {
  width: 100px;
  height: 100px;
  background: var(--light);
  border-radius: 8px;
  margin-right: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.favorite-image img {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
}
.favorite-info {
  flex: 1;
  min-width: 0;
}
.favorite-price {
  color: var(--warning);
  font-weight: bold;
  font-size: 1.2rem;
  margin: 5px 0;
}
.price-change {
  font-size: 0.9rem;
  padding: 3px 8px;
  border-radius: 10px;
  display: inline-block;
}
.price-up {
  background-color: rgba(255, 0, 0, 0.1);
  color: #e74c3c;
}
.price-down {
  background-color: rgba(0, 200, 83, 0.1);
  color: #00c853;
}
.alert-setting {
  display: flex;
  align-items: center;
  margin-top: 10px;
}
.alert-setting input {
  width: 100px;
  padding: 5px 10px;
  border: 1px solid var(--light-gray);
  border-radius: 5px;
  margin: 0 10px;
}
.btn {
  margin-top: 10px;
}
@media (max-width: 1200px) {
  .favorites-grid {
    gap: 10px;
  }
}
@media (max-width: 700px) {
  .favorites-grid {
    gap: 5px;
  }
  .favorite-item {
    flex-direction: column;
    align-items: flex-start;
  }
  .favorite-image {
    margin-bottom: 10px;
    margin-right: 0;
  }
}
</style> 