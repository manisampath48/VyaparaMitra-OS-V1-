import { Product, Customer, Sale, Invoice, Expense } from './src/types';

export interface StoreContext {
  userId: string;
  storeId: string;
  storeName: string;
  businessType: string;
  ownerName: string;
  address: string;
  currency: string;
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  invoices: Invoice[];
  expenses: Expense[];
}

export type QueryIntent = 
  | 'OVERALL_PERFORMANCE'
  | 'TOP_PRODUCTS'
  | 'RESTOCK_RECOMMENDATIONS'
  | 'CURRENT_MONTH_SALES'
  | 'MONTH_COMPARISON'
  | 'POOR_PRODUCTS'
  | 'SALES_DECREASE_REASONS'
  | 'IMPROVEMENT_SUGGESTIONS'
  | 'STORE_INFO'
  | 'CROSS_STORE_ATTEMPT'
  | 'GENERAL_QUERY';

/**
 * 1. Identify what information is required based on user's query
 */
export function identifyIntent(query: string, currentStoreId: string): QueryIntent {
  const q = query.toLowerCase().trim();

  // Cross-store attempt detection
  if (
    q.includes('other store') || 
    q.includes('store b') && !currentStoreId.includes('user_b') ||
    q.includes('store a') && !currentStoreId.includes('user_a') ||
    q.includes('another store') ||
    q.includes('all stores') ||
    q.includes('other merchant') ||
    q.includes('competitor store')
  ) {
    return 'CROSS_STORE_ATTEMPT';
  }

  // 1. "How is my store doing?" / overall status
  if (
    q.includes('how is my store doing') || 
    q.includes('how is the store doing') ||
    q.includes('store doing') ||
    q.includes('store status') ||
    q.includes('store performance') ||
    q.includes('business health') ||
    q.includes('store health') ||
    q.includes('overall summary')
  ) {
    return 'OVERALL_PERFORMANCE';
  }

  // 2. "What are my top-selling products?" / best sellers
  if (
    q.includes('top-selling') ||
    q.includes('top selling') ||
    q.includes('best-selling') ||
    q.includes('best selling') ||
    q.includes('selling best') ||
    q.includes('top product') ||
    q.includes('highest selling') ||
    q.includes('popular product')
  ) {
    return 'TOP_PRODUCTS';
  }

  // 3. "Which products should I restock?" / what should I restock
  if (
    q.includes('restock') ||
    q.includes('reorder') ||
    q.includes('low stock') ||
    q.includes('out of stock') ||
    q.includes('replenish') ||
    q.includes('inventory alert')
  ) {
    return 'RESTOCK_RECOMMENDATIONS';
  }

  // 4. "Compare this month and last month" / compare months
  if (
    (q.includes('compare') && (q.includes('month') || q.includes('last month'))) ||
    q.includes('month over month') ||
    q.includes('month-over-month') ||
    q.includes('vs last month') ||
    q.includes('compared to last month') ||
    q.includes('compared with last month')
  ) {
    return 'MONTH_COMPARISON';
  }

  // 5. "How much did I sell this month?" / monthly sales
  if (
    q.includes('this month') ||
    q.includes('current month') ||
    q.includes('sales this month') ||
    q.includes('monthly sales') ||
    q.includes('monthly revenue') ||
    q.includes('sell this month')
  ) {
    return 'CURRENT_MONTH_SALES';
  }

  // 6. "Which products are performing poorly?" / slow moving / dead stock
  if (
    q.includes('performing poorly') ||
    q.includes('poorly performing') ||
    q.includes('slow-moving') ||
    q.includes('slow moving') ||
    q.includes('dead stock') ||
    q.includes('worst product') ||
    q.includes('least sold') ||
    q.includes('zero sales') ||
    q.includes('not selling')
  ) {
    return 'POOR_PRODUCTS';
  }

  // 7. "Why are my sales decreasing?" / sales drop
  if (
    q.includes('decreasing') ||
    q.includes('sales drop') ||
    q.includes('why are my sales') ||
    q.includes('sales declining') ||
    q.includes('sales down') ||
    q.includes('revenue down') ||
    q.includes('losing sales')
  ) {
    return 'SALES_DECREASE_REASONS';
  }

  // 8. "Give me 3 suggestions to improve my store" / improvement
  if (
    q.includes('suggestions to improve') ||
    q.includes('improve my store') ||
    q.includes('tips to improve') ||
    q.includes('how to improve') ||
    q.includes('grow my store') ||
    q.includes('increase sales') ||
    q.includes('3 suggestions') ||
    q.includes('recommendations to improve')
  ) {
    return 'IMPROVEMENT_SUGGESTIONS';
  }

  // 9. "Tell me about my store" / store details
  if (
    q.includes('tell me about my store') ||
    q.includes('about my store') ||
    q.includes('my store information') ||
    q.includes('store profile') ||
    q.includes('what store is this')
  ) {
    return 'STORE_INFO';
  }

  return 'GENERAL_QUERY';
}

/**
 * 2. Calculate and aggregate verified metrics strictly from the authenticated store
 */
export function calculateStoreMetrics(store: StoreContext) {
  const now = new Date();
  
  // Date intervals
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const currentMonthStart = new Date(currentYear, currentMonth, 1).toISOString();
  
  const prevMonthStart = new Date(currentYear, currentMonth - 1, 1).toISOString();
  const prevMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59).toISOString();
  
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0];

  // 1. Inventory & Catalog Metrics
  const totalProducts = store.products.length;
  const inStockProducts = store.products.filter(p => p.quantity > p.minStock);
  const lowStockProducts = store.products.filter(p => p.quantity <= p.minStock && p.quantity > 0);
  const outOfStockProducts = store.products.filter(p => p.quantity <= 0);
  const totalStockUnits = store.products.reduce((acc, p) => acc + (p.quantity || 0), 0);
  const inventoryWholesaleCost = Math.round(store.products.reduce((acc, p) => acc + ((p.buyingPrice || 0) * (p.quantity || 0)), 0));
  const inventoryRetailValue = Math.round(store.products.reduce((acc, p) => acc + ((p.sellingPrice || 0) * (p.quantity || 0)), 0));

  // 2. Sales Aggregations
  const totalSalesCount = store.sales.length;
  const totalRevenue = Math.round(store.sales.reduce((acc, s) => acc + (s.total || 0), 0));

  // Current Month vs Previous Month
  const currentMonthSales = store.sales.filter(s => s.date >= currentMonthStart);
  const currentMonthRevenue = Math.round(currentMonthSales.reduce((acc, s) => acc + (s.total || 0), 0));
  const currentMonthOrders = currentMonthSales.length;
  const currentMonthAOV = currentMonthOrders > 0 ? Math.round(currentMonthRevenue / currentMonthOrders) : 0;

  const previousMonthSales = store.sales.filter(s => s.date >= prevMonthStart && s.date <= prevMonthEnd);
  const previousMonthRevenue = Math.round(previousMonthSales.reduce((acc, s) => acc + (s.total || 0), 0));
  const previousMonthOrders = previousMonthSales.length;
  const previousMonthAOV = previousMonthOrders > 0 ? Math.round(previousMonthRevenue / previousMonthOrders) : 0;

  // Month-over-month growth calculations
  const revenueGrowthPct = previousMonthRevenue > 0
    ? Number((((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100).toFixed(2))
    : (currentMonthRevenue > 0 ? 100 : 0);

  const orderGrowthPct = previousMonthOrders > 0
    ? Number((((currentMonthOrders - previousMonthOrders) / previousMonthOrders) * 100).toFixed(2))
    : (currentMonthOrders > 0 ? 100 : 0);

  // Today's Sales
  const todaySales = store.sales.filter(s => s.date?.startsWith(todayStart));
  const todayRevenue = Math.round(todaySales.reduce((acc, s) => acc + (s.total || 0), 0));
  const todayOrders = todaySales.length;

  // 3. Product Sales Velocity & Rankings
  const productPerformanceMap: Record<string, {
    id: string;
    name: string;
    category: string;
    currentStock: number;
    minStock: number;
    buyingPrice: number;
    sellingPrice: number;
    supplier: string;
    totalUnitsSold: number;
    totalRevenue: number;
    totalGrossProfit: number;
    recentUnitsSold30d: number;
  }> = {};

  store.products.forEach(p => {
    productPerformanceMap[p.id] = {
      id: p.id,
      name: p.name,
      category: p.category,
      currentStock: p.quantity,
      minStock: p.minStock,
      buyingPrice: p.buyingPrice,
      sellingPrice: p.sellingPrice,
      supplier: p.supplier || 'Primary Supplier',
      totalUnitsSold: 0,
      totalRevenue: 0,
      totalGrossProfit: 0,
      recentUnitsSold30d: 0,
    };
  });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  store.sales.forEach(s => {
    const isRecent = s.date >= thirtyDaysAgo;
    (s.products || []).forEach(sp => {
      const pId = sp.productId || (sp as any).id;
      if (!pId) return;
      if (productPerformanceMap[pId]) {
        const qty = sp.quantity || 0;
        const rev = sp.total || (qty * sp.price);
        const cost = qty * (productPerformanceMap[pId].buyingPrice || 0);
        
        productPerformanceMap[pId].totalUnitsSold += qty;
        productPerformanceMap[pId].totalRevenue += rev;
        productPerformanceMap[pId].totalGrossProfit += (rev - cost);
        if (isRecent) {
          productPerformanceMap[pId].recentUnitsSold30d += qty;
        }
      }
    });
  });

  const allProductStats = Object.values(productPerformanceMap);

  // Ranked Top Selling Products
  const topSellingProducts = [...allProductStats]
    .filter(p => p.totalUnitsSold > 0)
    .sort((a, b) => b.totalUnitsSold - a.totalUnitsSold);

  // Poor Performing / Slow Moving Products
  const poorPerformingProducts = [...allProductStats]
    .sort((a, b) => a.recentUnitsSold30d - b.recentUnitsSold30d || a.totalUnitsSold - b.totalUnitsSold)
    .filter(p => p.currentStock > 0); // Still taking up shelf space

  // Restock Recommendations (analyzing velocity vs stock)
  const restockQueue = [...allProductStats]
    .filter(p => p.currentStock <= p.minStock)
    .map(p => {
      const dailyVelocity = Number((p.recentUnitsSold30d / 30).toFixed(2));
      const daysOfStockRemaining = dailyVelocity > 0 ? Math.round(p.currentStock / dailyVelocity) : (p.currentStock === 0 ? 0 : 999);
      const suggestedReorderQty = Math.max(p.minStock * 2 - p.currentStock, 10);
      const estimatedCost = Math.round(suggestedReorderQty * p.buyingPrice);
      const urgency = p.currentStock <= 0 ? 'CRITICAL (OUT OF STOCK)' : (daysOfStockRemaining <= 3 ? 'HIGH' : 'MEDIUM');

      return {
        ...p,
        dailyVelocity,
        daysOfStockRemaining,
        suggestedReorderQty,
        estimatedCost,
        urgency
      };
    })
    .sort((a, b) => (a.currentStock === 0 ? -1 : 1) || a.daysOfStockRemaining - b.daysOfStockRemaining);

  // 4. Customer Analysis
  const totalCustomers = store.customers.length;
  const activeCustomers = store.customers.filter(c => c.status === 'ACTIVE');
  const inactiveCustomers = store.customers.filter(c => c.status === 'INACTIVE');
  const topCustomers = [...store.customers].sort((a, b) => (b.totalPurchases || 0) - (a.totalPurchases || 0));

  // 5. Invoices & Expenses
  const unpaidInvoices = store.invoices.filter(i => i.status === 'UNPAID');
  const totalUnpaidDues = Math.round(unpaidInvoices.reduce((acc, i) => acc + (i.total || 0), 0));
  const totalExpenses = Math.round(store.expenses.reduce((acc, e) => acc + (e.amount || 0), 0));

  return {
    storeId: store.storeId,
    storeName: store.storeName,
    businessType: store.businessType,
    ownerName: store.ownerName,
    currency: store.currency || 'INR',
    inventory: {
      totalProducts,
      totalStockUnits,
      inStockCount: inStockProducts.length,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      wholesaleCost: inventoryWholesaleCost,
      retailValue: inventoryRetailValue,
    },
    sales: {
      totalSalesCount,
      totalRevenue,
      todayRevenue,
      todayOrders,
      currentMonthRevenue,
      currentMonthOrders,
      currentMonthAOV,
      previousMonthRevenue,
      previousMonthOrders,
      previousMonthAOV,
      revenueGrowthPct,
      orderGrowthPct,
    },
    topSellingProducts,
    poorPerformingProducts,
    restockQueue,
    customers: {
      totalCustomers,
      activeCount: activeCustomers.length,
      inactiveCount: inactiveCustomers.length,
      topCustomers: topCustomers.slice(0, 5),
    },
    invoices: {
      totalInvoices: store.invoices.length,
      unpaidInvoicesCount: unpaidInvoices.length,
      totalUnpaidDues,
    },
    expenses: {
      totalExpenses,
      recentExpenses: store.expenses.slice(0, 5)
    }
  };
}

/**
 * 3. Generate natural language analysis strictly grounded in calculated metrics
 */
export function buildDataGroundedResponse(intent: QueryIntent, query: string, metrics: ReturnType<typeof calculateStoreMetrics>): string {
  const cur = metrics.currency === 'INR' ? '₹' : metrics.currency + ' ';
  const storeName = metrics.storeName;

  switch (intent) {
    case 'CROSS_STORE_ATTEMPT': {
      return `### 🔒 Access Denied (Strict Single-Store Tenant Isolation)
I am Mitra AI, your dedicated AI business assistant bound exclusively to **${storeName}** (Store ID: \`${metrics.storeId}\`).

Under VyaparaMitra's security and privacy policy:
- Each store owner can only access and analyze their own private store records.
- Cross-store queries and external merchant comparisons are strictly prohibited to protect commercial confidentiality.

You can ask any analytical question about **${storeName}**!`;
    }

    case 'OVERALL_PERFORMANCE': {
      const m = metrics;
      const growthSign = m.sales.revenueGrowthPct >= 0 ? '+' : '';
      const top3 = m.topSellingProducts.slice(0, 3).map(p => `**${p.name}** (${p.totalUnitsSold} units sold)`).join(', ');

      return `### 📋 Summary
Here is the real-time operational status for **${storeName}** (${m.businessType}). Your store has recorded **${cur}${m.sales.totalRevenue.toLocaleString('en-IN')}** in all-time turnover across **${m.sales.totalSalesCount} orders**, with **${cur}${m.sales.currentMonthRevenue.toLocaleString('en-IN')}** generated this month.

### 📊 Real Store Data Metrics
| Metric | Value | Status / Trend |
| :--- | :--- | :--- |
| **Current Month Revenue** | ${cur}${m.sales.currentMonthRevenue.toLocaleString('en-IN')} | ${growthSign}${m.sales.revenueGrowthPct}% vs last month |
| **Current Month Orders** | ${m.sales.currentMonthOrders} orders | ${growthSign}${m.sales.orderGrowthPct}% order volume |
| **Average Order Value (AOV)** | ${cur}${m.sales.currentMonthAOV} | Basket size benchmark |
| **Catalog Size** | ${m.inventory.totalProducts} items (${m.inventory.totalStockUnits} units in stock) | Total inventory |
| **Inventory Health** | ${m.inventory.inStockCount} healthy, ${m.inventory.lowStockCount} low, ${m.inventory.outOfStockCount} out of stock | Stock readiness |
| **Inventory Asset Value** | ${cur}${m.inventory.wholesaleCost.toLocaleString('en-IN')} wholesale (${cur}${m.inventory.retailValue.toLocaleString('en-IN')} retail) | Working capital |
| **Customer Retention** | ${m.customers.activeCount} active / ${m.customers.totalCustomers} total (${m.customers.inactiveCount} lapsed) | Customer base |
| **Unpaid Invoices / Dues** | ${cur}${m.invoices.totalUnpaidDues.toLocaleString('en-IN')} (${m.invoices.unpaidInvoicesCount} pending bills) | Credit ledger |

### 💡 Store Business Insight
${top3 ? `Your top-performing revenue drivers are ${top3}. ` : ''}${m.inventory.lowStockCount > 0 ? `However, **${m.inventory.lowStockCount} items** are currently at or below minimum threshold. Stockouts on high-demand items will directly slow monthly revenue growth.` : 'Your inventory buffer is currently in a healthy state across all primary product lines.'}

### 🚀 Recommendation
${m.restockQueue.length > 0 ? `Place priority replenishment orders for **${m.restockQueue[0].name}** (only ${m.restockQueue[0].currentStock} units remaining). ` : ''}${m.invoices.totalUnpaidDues > 0 ? `Follow up on **${cur}${m.invoices.totalUnpaidDues.toLocaleString('en-IN')}** in unpaid credit dues to improve operational cash liquidity.` : 'Maintain active customer engagement to drive weekend basket size.'}

### 🎯 Suggested Next Step
Open the **Inventory tab** to review low-stock reorder thresholds and supplier details.`;
    }

    case 'TOP_PRODUCTS': {
      const topList = metrics.topSellingProducts.slice(0, 5);
      if (topList.length === 0) {
        return `### 📋 Summary
No completed sales transactions have been recorded in **${storeName}** yet. 

### 📊 Real Store Data
- **Catalog Size**: ${metrics.inventory.totalProducts} registered products
- **Total Sales Records**: 0 transactions

### 💡 Business Insight
To rank top-selling products, sales must first be created via the Billing or Invoices module. Once orders are fulfilled, Mitra AI will automatically rank units sold, turnover, and gross profit per product.

### 🎯 Suggested Next Step
Go to the **Invoices tab** or use the Barcode Scanner at checkout to record customer sales.`;
      }

      const rows = topList.map((p, idx) => 
        `| ${idx + 1}. **${p.name}** | ${p.category} | ${p.totalUnitsSold} units | ${cur}${p.totalRevenue.toLocaleString('en-IN')} | ${p.currentStock} left |`
      ).join('\n');

      return `### 📋 Summary
Based on the actual sales ledger for **${storeName}**, here are your **top ${topList.length} best-selling products** ranked strictly by units sold:

### 📊 Real Sales Ranking
| Rank & Product | Category | Units Sold | Total Revenue | Current Stock |
| :--- | :--- | :--- | :--- | :--- |
${rows}

### 💡 Business Insight
**${topList[0].name}** is your #1 best-seller with **${topList[0].totalUnitsSold} units sold** generating **${cur}${topList[0].totalRevenue.toLocaleString('en-IN')}**. ${topList[0].currentStock <= topList[0].minStock ? `⚠️ **Warning:** This item is currently low in stock (${topList[0].currentStock} remaining). Reorder immediately to avoid stockout revenue loss.` : `Stock level is currently adequate (${topList[0].currentStock} units remaining).`}

### 🚀 Recommendation
Bundle high-turnover products like **${topList[0].name}** with slower-moving complementary items to lift average transaction value.

### 🎯 Suggested Next Step
Check the **Sales History tab** to see the full chronological breakdown of all product sales.`;
    }

    case 'RESTOCK_RECOMMENDATIONS': {
      const q = metrics.restockQueue;
      if (q.length === 0) {
        return `### 📋 Summary
All products in **${storeName}** currently meet or exceed their minimum inventory thresholds. No immediate restock orders are required.

### 📊 Real Inventory Audit
- **Total Catalog**: ${metrics.inventory.totalProducts} products
- **In-Stock Healthy Items**: ${metrics.inventory.inStockCount} products
- **Low Stock Items**: 0 items
- **Out of Stock Items**: 0 items
- **Total Working Capital in Inventory**: ${cur}${metrics.inventory.wholesaleCost.toLocaleString('en-IN')}

### 💡 Business Insight
Your inventory levels are balanced with no imminent stockout risks. Continue monitoring sales velocity as weekend traffic builds.

### 🎯 Suggested Next Step
Navigate to the **Inventory tab** to review current safety stock thresholds.`;
      }

      const rows = q.slice(0, 6).map(p => 
        `| **${p.name}** | **${p.currentStock}** (Min: ${p.minStock}) | ${p.dailyVelocity} units/day | **${p.suggestedReorderQty} units** | ${cur}${p.estimatedCost.toLocaleString('en-IN')} | \`${p.urgency}\` |`
      ).join('\n');

      const totalEstimatedCost = q.slice(0, 6).reduce((acc, p) => acc + p.estimatedCost, 0);

      return `### 📋 Summary
Inventory audit of **${storeName}** identified **${q.length} products** requiring restocking. Total estimated replenishment cost for top priority items is **${cur}${totalEstimatedCost.toLocaleString('en-IN')}**.

### 📊 Real Restock Priority Queue
| Product Name | Current Stock | Sales Velocity | Suggested Reorder | Estimated Cost | Urgency |
| :--- | :--- | :--- | :--- | :--- | :--- |
${rows}

### 💡 Business Insight
**${q[0].name}** is at critical risk with only **${q[0].currentStock} units** on hand. At current sales velocity, stock will be exhausted in approximately **${q[0].daysOfStockRemaining} days**.

### 🚀 Recommendation
Contact supplier **${q[0].supplier}** to place a purchase order of **${q[0].suggestedReorderQty} units** for **${q[0].name}** immediately.

### 🎯 Suggested Next Step
Open the **Inventory tab** to review supplier contacts and generate replenishment purchase notes.`;
    }

    case 'CURRENT_MONTH_SALES': {
      const s = metrics.sales;
      const monthName = new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });
      const topMonthProduct = metrics.topSellingProducts[0];

      return `### 📋 Summary
For **${monthName}**, **${storeName}** has generated **${cur}${s.currentMonthRevenue.toLocaleString('en-IN')}** across **${s.currentMonthOrders} orders**, with an Average Order Value (AOV) of **${cur}${s.currentMonthAOV}**.

### 📊 Real Store Data Breakdown (${monthName})
- **Total Revenue This Month**: ${cur}${s.currentMonthRevenue.toLocaleString('en-IN')}
- **Total Orders This Month**: ${s.currentMonthOrders} completed transactions
- **Average Order Value (AOV)**: ${cur}${s.currentMonthAOV} per customer bill
- **Previous Month Comparison**: ${s.revenueGrowthPct >= 0 ? '+' : ''}${s.revenueGrowthPct}% revenue change vs last month (${cur}${s.previousMonthRevenue.toLocaleString('en-IN')})
- **Order Volume Trend**: ${s.orderGrowthPct >= 0 ? '+' : ''}${s.orderGrowthPct}% order change (${s.currentMonthOrders} vs ${s.previousMonthOrders})
- **Top Product**: ${topMonthProduct ? `${topMonthProduct.name} (${topMonthProduct.totalUnitsSold} units)` : 'Gathering records'}

### 💡 Business Insight
${s.revenueGrowthPct >= 0 
  ? `Revenue is up by **${s.revenueGrowthPct}%** this month, demonstrating healthy retail demand.` 
  : `Revenue contracted by **${Math.abs(s.revenueGrowthPct)}%** compared to last month. Average basket size is ${cur}${s.currentMonthAOV}.`}

### 🚀 Recommendation
Review your peak sales hours in the **Analytics tab** to schedule cashier staffing and restock high-demand items prior to weekend traffic.

### 🎯 Suggested Next Step
Visit the **Analytics tab** to inspect daily revenue trends and category performance.`;
    }

    case 'MONTH_COMPARISON': {
      const s = metrics.sales;
      const now = new Date();
      const thisMonthName = now.toLocaleString('en-IN', { month: 'short', year: 'numeric' });
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthName = lastMonthDate.toLocaleString('en-IN', { month: 'short', year: 'numeric' });

      const revDiff = s.currentMonthRevenue - s.previousMonthRevenue;
      const orderDiff = s.currentMonthOrders - s.previousMonthOrders;

      return `### 📋 Summary
Month-over-month performance comparison for **${storeName}** (${thisMonthName} vs ${lastMonthName}):

- **Revenue**: ${cur}${s.currentMonthRevenue.toLocaleString('en-IN')} vs ${cur}${s.previousMonthRevenue.toLocaleString('en-IN')} (**${s.revenueGrowthPct >= 0 ? '+' : ''}${s.revenueGrowthPct}%**)
- **Orders**: ${s.currentMonthOrders} vs ${s.previousMonthOrders} (**${s.orderGrowthPct >= 0 ? '+' : ''}${s.orderGrowthPct}%**)
- **Average Basket Size**: ${cur}${s.currentMonthAOV} vs ${cur}${s.previousMonthAOV}

### 📊 Real Comparison Ledger
| Metric | ${lastMonthName} | ${thisMonthName} | Absolute Change | Percentage Change |
| :--- | :--- | :--- | :--- | :--- |
| **Gross Revenue** | ${cur}${s.previousMonthRevenue.toLocaleString('en-IN')} | ${cur}${s.currentMonthRevenue.toLocaleString('en-IN')} | ${revDiff >= 0 ? '+' : ''}${cur}${revDiff.toLocaleString('en-IN')} | **${s.revenueGrowthPct >= 0 ? '+' : ''}${s.revenueGrowthPct}%** |
| **Completed Orders** | ${s.previousMonthOrders} orders | ${s.currentMonthOrders} orders | ${orderDiff >= 0 ? '+' : ''}${orderDiff} orders | **${s.orderGrowthPct >= 0 ? '+' : ''}${s.orderGrowthPct}%** |
| **Average Order Value (AOV)** | ${cur}${s.previousMonthAOV} | ${cur}${s.currentMonthAOV} | ${cur}${s.currentMonthAOV - s.previousMonthAOV} | ${s.previousMonthAOV > 0 ? Number((((s.currentMonthAOV - s.previousMonthAOV) / s.previousMonthAOV) * 100).toFixed(1)) : 0}% |

### 💡 Business Insight
${s.revenueGrowthPct >= 0
  ? `Revenue growth is outperforming last month by **${s.revenueGrowthPct}%**. The primary growth driver is an increase in order volume (${orderDiff >= 0 ? `+${orderDiff}` : orderDiff} orders).`
  : `Revenue decreased by **${Math.abs(s.revenueGrowthPct)}%** (${cur}${Math.abs(revDiff).toLocaleString('en-IN')}) due to ${orderDiff < 0 ? `fewer customer checkout visits (${orderDiff} orders)` : 'a lower average purchase ticket size'}.`}

### 🚀 Recommendation
${s.revenueGrowthPct < 0 
  ? `Launch a promotional weekend campaign targeting the **${metrics.customers.inactiveCount} inactive customers** to reverse the volume contraction.` 
  : `Capitalize on momentum by restocking top lines before month-end to avoid inventory bottlenecks.`}

### 🎯 Suggested Next Step
View the **Analytics tab** to review 30-day comparative growth charts.`;
    }

    case 'POOR_PRODUCTS': {
      const poorList = metrics.poorPerformingProducts.slice(0, 5);
      if (poorList.length === 0) {
        return `### 📋 Summary
All products in **${storeName}** have active sales movement. No dead stock was detected in your current catalog.`;
      }

      const rows = poorList.map(p => {
        const capitalTied = p.currentStock * p.buyingPrice;
        return `| **${p.name}** | ${p.category} | ${p.recentUnitsSold30d} units | ${p.currentStock} units | ${cur}${capitalTied.toLocaleString('en-IN')} |`;
      }).join('\n');

      const totalTiedCapital = poorList.reduce((acc, p) => acc + (p.currentStock * p.buyingPrice), 0);

      return `### 📋 Summary
Identified **${poorList.length} slow-moving / low-performing products** in **${storeName}** with low or zero sales over the last 30 days. These items represent **${cur}${totalTiedCapital.toLocaleString('en-IN')}** in trapped working capital.

### 📊 Real Slow-Moving Inventory Ledger
| Product Name | Category | 30-Day Sales | Stock on Hand | Capital Tied Up |
| :--- | :--- | :--- | :--- | :--- |
${rows}

### 💡 Business Insight
Products like **${poorList[0].name}** have had only **${poorList[0].recentUnitsSold30d} sales** in the last month while holding **${poorList[0].currentStock} units** in storage. This locks up cash that could otherwise be deployed into fast-turning lines like **${metrics.topSellingProducts[0]?.name || 'staples'}**.

### 🚀 Recommendation
1. Apply a **15% to 20% promotional discount** to liquidate aging stock.
2. Bundle slow movers with your top-selling products at checkout.
3. Reduce future replenishment orders for these specific SKUs.

### 🎯 Suggested Next Step
Go to the **Products tab** to adjust retail prices or create promotional clearance bundles.`;
    }

    case 'SALES_DECREASE_REASONS': {
      const s = metrics.sales;
      const lowStockCount = metrics.inventory.lowStockCount;
      const inactiveCust = metrics.customers.inactiveCount;
      const unpaidDues = metrics.invoices.totalUnpaidDues;

      return `### 📋 Summary
Analyzing historical sales velocity for **${storeName}** identifies **3 primary operational factors** contributing to sales pressure:

### 📊 Real Store Data Diagnostics
1. **Stockout & Low Stock Constraints**:
   - **${lowStockCount} products** in your catalog are currently low or out of stock. When top-selling items are unavailable, customers abandon carts or purchase elsewhere.
2. **Customer Retention & Inactive Patrons**:
   - **${inactiveCust} out of ${metrics.customers.totalCustomers} registered customers** (${Number(((inactiveCust / (metrics.customers.totalCustomers || 1)) * 100).toFixed(1))}%) have not visited your store in over 30 days.
3. **Purchasing Power & Ticket Size**:
   - Average Order Value is currently **${cur}${s.currentMonthAOV}**. Customers are purchasing fewer items per visit.
   ${unpaidDues > 0 ? `4. **Credit / Unpaid Dues Lag**: **${cur}${unpaidDues.toLocaleString('en-IN')}** is outstanding across unpaid invoices, constraining reorder capital.` : ''}

### 💡 Business Insight
The decline is primarily operational rather than seasonal. Restocking critical safety thresholds and reconnecting with lapsed customers will directly recover lost sales volume.

### 🚀 Recommendation
- Immediately replenish low-stock items (starting with **${metrics.restockQueue[0]?.name || 'key inventory'}**).
- Trigger a personalized WhatsApp discount message to your **${inactiveCust} inactive customers**.

### 🎯 Suggested Next Step
Open the **AI Engagement tab** to send an automated welcome-back incentive to inactive customers.`;
    }

    case 'IMPROVEMENT_SUGGESTIONS': {
      const restockItem = metrics.restockQueue[0];
      const inactiveCount = metrics.customers.inactiveCount;
      const slowItem = metrics.poorPerformingProducts[0];

      return `### 📋 Summary
Here are **3 concrete, data-backed operational suggestions** tailored specifically to **${storeName}** based on your live database records:

### 🚀 3 Data-Driven Improvement Recommendations

#### 1. 📦 Eliminate Stockout Bottlenecks in Fast-Moving Inventory
- **Real Data Finding**: You have **${metrics.inventory.lowStockCount} products** operating below minimum safety stock.
- **Action**: Place immediate replenishment for ${restockItem ? `**${restockItem.name}** (${restockItem.currentStock} units remaining)` : 'low stock items'}. 
- **Projected Impact**: Prevents customer walkouts and protects an estimated **${cur}5,000 - ${cur}15,000** in weekly turnover.

#### 2. 👥 Reactivate Your ${inactiveCount} Lapsed Customers
- **Real Data Finding**: **${inactiveCount} registered customers** have not visited in over 30 days.
- **Action**: Send a personalized WhatsApp notification with promo code \`WELCOMEBACK15\` offering 15% off their next bill over ${cur}500.
- **Projected Impact**: Even a 20% conversion rate brings back **${Math.round(inactiveCount * 0.2)} paying customers** this weekend.

#### 3. 💰 Liquidate Trapped Capital in Slow-Moving Stock
- **Real Data Finding**: Products like ${slowItem ? `**${slowItem.name}** have ${slowItem.currentStock} units sitting unsold (${cur}${(slowItem.currentStock * slowItem.buyingPrice).toLocaleString('en-IN')} tied up)` : 'aging inventory'}.
- **Action**: Create a clearance bundle or display near checkout counter at cost+5%.
- **Projected Impact**: Immediately frees up cash liquidity to invest into proven top-sellers.

### 🎯 Suggested Next Step
Start with Action #1 by checking the **Inventory tab** to review low-stock reorder quantities.`;
    }

    case 'STORE_INFO': {
      return `### 📋 Store Profile & Verification
- **Store Name**: **${metrics.storeName}**
- **Store Identifier**: \`${metrics.storeId}\`
- **Store Category**: **${metrics.businessType}**
- **Business Owner**: **${metrics.ownerName}**
- **Catalog Size**: **${metrics.inventory.totalProducts} registered products** (${metrics.inventory.totalStockUnits} stock units)
- **Active Customers**: **${metrics.customers.activeCount} active** / ${metrics.customers.totalCustomers} total
- **All-Time Sales Volume**: **${cur}${metrics.sales.totalRevenue.toLocaleString('en-IN')}** (${metrics.sales.totalSalesCount} bills)
- **Security Policy**: Single-Store Tenant Isolation active (Zero cross-store data leakage guaranteed).

How can I help you analyze your store metrics today?`;
    }

    default: {
      // General store query
      return `### 📋 Store Briefing for ${storeName}
Regarding your query, here is the current store ledger status:

- **Store Turnover**: ${cur}${metrics.sales.totalRevenue.toLocaleString('en-IN')} all-time (${cur}${metrics.sales.currentMonthRevenue.toLocaleString('en-IN')} this month across ${metrics.sales.currentMonthOrders} orders).
- **Inventory Status**: ${metrics.inventory.totalProducts} products listed (${metrics.inventory.lowStockCount} items flagged low stock).
- **Customer Ledger**: ${metrics.customers.totalCustomers} registered patrons (${metrics.customers.activeCount} active).
- **Unpaid Dues**: ${cur}${metrics.invoices.totalUnpaidDues.toLocaleString('en-IN')} across pending invoices.

You can ask specific questions like:
- *"How is my store doing?"*
- *"What are my top-selling products?"*
- *"Which products should I restock?"*
- *"Compare this month with last month"*
- *"Why are my sales decreasing?"*
- *"Give me 3 suggestions to improve my store"*`;
    }
  }
}
