import fs from 'fs';
import path from 'path';
import { Product, Customer, Sale, Invoice, Expense } from './src/types';

const DB_FILE = path.join(process.cwd(), 'database.json');

export const generateDefaultExpenses = (userId: string = 'u_owner'): Expense[] => [
  {
    id: `exp_1_${userId}`,
    category: 'Rent',
    description: 'Monthly Store Retail Space Lease',
    amount: 32000,
    date: new Date(Date.now() - 3 * 86400000).toISOString(),
    paymentMethod: 'NetBanking',
    userId
  },
  {
    id: `exp_2_${userId}`,
    category: 'Utilities',
    description: 'Commercial Electricity & Power Backup',
    amount: 7850,
    date: new Date(Date.now() - 5 * 86400000).toISOString(),
    paymentMethod: 'UPI',
    userId
  },
  {
    id: `exp_3_${userId}`,
    category: 'Salaries',
    description: 'Store Floor & Cashier Staff Wages',
    amount: 22000,
    date: new Date(Date.now() - 7 * 86400000).toISOString(),
    paymentMethod: 'Bank Transfer',
    userId
  },
  {
    id: `exp_4_${userId}`,
    category: 'Logistics',
    description: 'Wholesale Distributor Delivery & Restock Freight',
    amount: 3450,
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    paymentMethod: 'Cash',
    userId
  },
  {
    id: `exp_5_${userId}`,
    category: 'Packaging',
    description: 'Billing Thermal Rolls, QR Tags & Carry Bags',
    amount: 1950,
    date: new Date(Date.now() - 4 * 86400000).toISOString(),
    paymentMethod: 'UPI',
    userId
  }
];

// Realistic Indian Names for Mock Data
const FIRST_NAMES = [
  'Rajesh', 'Priya', 'Amit', 'Sunita', 'Rahul', 'Anjali', 'Vikram', 'Neha', 'Suresh', 'Kavita',
  'Arjun', 'Deepika', 'Manish', 'Pooja', 'Sanjay', 'Ritu', 'Vijay', 'Meera', 'Rohan', 'Swati',
  'Abhishek', 'Kiran', 'Harish', 'Aisha', 'Vivek', 'Sneha', 'Anil', 'Divya', 'Ramesh', 'Shalini',
  'Gaurav', 'Aditi', 'Alok', 'Tanya', 'Kartik', 'Shruti', 'Pranav', 'Nisha', 'Manoj', 'Komal'
];

const LAST_NAMES = [
  'Kumar', 'Sharma', 'Patel', 'Rao', 'Verma', 'Desai', 'Singh', 'Gupta', 'Reddy', 'Nair',
  'Joshi', 'Mehta', 'Choudhary', 'Iyer', 'Mishra', 'Prasad', 'Yadav', 'Shah', 'Narayanan', 'Saxena',
  'Dubey', 'Grover', 'Trivedi', 'Bose', 'Gill', 'Ranjan', 'Shenoy', 'Pandey', 'Dutta', 'Pillai'
];

// Helper to generate a random phone number
function generatePhone() {
  const digits = '789';
  let phone = digits[Math.floor(Math.random() * digits.length)];
  for (let i = 0; i < 9; i++) {
    phone += Math.floor(Math.random() * 10);
  }
  return '+91 ' + phone.substring(0, 5) + ' ' + phone.substring(5);
}

// Generate a random date in the last N days
function randomDate(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  // Add some random hours
  date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  return date.toISOString();
}

// All 30 business profiles
export const BUSINESS_CATALOGS: Record<string, Array<{ name: string; category: string; price: number; unit: string; minStock: number }>> = {
  'GROCERY': [
    { name: 'Basmati Rice 25kg', category: 'Rice', price: 1850, unit: 'bag', minStock: 8 },
    { name: 'Sona Masoori Rice 25kg', category: 'Rice', price: 1450, unit: 'bag', minStock: 8 },
    { name: 'Wheat Flour 5kg', category: 'Flour', price: 260, unit: 'bag', minStock: 10 },
    { name: 'Sugar 1kg', category: 'Sugar', price: 50, unit: 'packet', minStock: 15 },
    { name: 'Salt 1kg', category: 'Salt', price: 28, unit: 'packet', minStock: 15 },
    { name: 'Sunflower Oil 1L', category: 'Cooking Oil', price: 165, unit: 'bottle', minStock: 12 },
    { name: 'Groundnut Oil 1L', category: 'Cooking Oil', price: 195, unit: 'bottle', minStock: 12 },
    { name: 'Toor Dal 1kg', category: 'Pulses', price: 140, unit: 'packet', minStock: 12 },
    { name: 'Moong Dal 1kg', category: 'Pulses', price: 120, unit: 'packet', minStock: 12 },
    { name: 'Chana Dal 1kg', category: 'Pulses', price: 110, unit: 'packet', minStock: 12 },
    { name: 'Tea Powder', category: 'Beverages', price: 120, unit: 'packet', minStock: 12 },
    { name: 'Coffee Powder', category: 'Beverages', price: 160, unit: 'packet', minStock: 12 },
    { name: 'Milk Packet', category: 'Dairy', price: 30, unit: 'packet', minStock: 25 },
    { name: 'Bread', category: 'Dairy', price: 45, unit: 'loaf', minStock: 15 },
    { name: 'Eggs', category: 'Dairy', price: 70, unit: 'pack', minStock: 20 },
    { name: 'Butter', category: 'Dairy', price: 62, unit: 'block', minStock: 15 },
    { name: 'Cheese', category: 'Dairy', price: 120, unit: 'block', minStock: 10 },
    { name: 'Maggi Noodles', category: 'Snacks', price: 15, unit: 'packet', minStock: 25 },
    { name: 'Biscuits', category: 'Snacks', price: 20, unit: 'packet', minStock: 20 },
    { name: 'Soft Drinks', category: 'Beverages', price: 95, unit: 'bottle', minStock: 15 },
    { name: 'Mineral Water', category: 'Beverages', price: 20, unit: 'bottle', minStock: 20 },
    { name: 'Apples', category: 'Fruits', price: 180, unit: 'kg', minStock: 10 },
    { name: 'Bananas', category: 'Fruits', price: 60, unit: 'dozen', minStock: 15 },
    { name: 'Tomatoes', category: 'Vegetables', price: 40, unit: 'kg', minStock: 20 },
    { name: 'Onions', category: 'Vegetables', price: 35, unit: 'kg', minStock: 20 },
    { name: 'Potatoes', category: 'Vegetables', price: 30, unit: 'kg', minStock: 20 }
  ],
  'PHARMACY': [
    { name: 'Paracetamol 500mg', category: 'Tablets', price: 15, unit: 'strip', minStock: 25 },
    { name: 'Cetirizine Tablets', category: 'Tablets', price: 35, unit: 'strip', minStock: 20 },
    { name: 'Vitamin C Tablets', category: 'Tablets', price: 25, unit: 'strip', minStock: 20 },
    { name: 'Cough Syrup', category: 'Syrups', price: 120, unit: 'bottle', minStock: 12 },
    { name: 'ORS Powder', category: 'Wellness', price: 20, unit: 'packet', minStock: 25 },
    { name: 'Glucose Powder', category: 'Wellness', price: 60, unit: 'packet', minStock: 15 },
    { name: 'Antiseptic Solution', category: 'Personal Care', price: 145, unit: 'bottle', minStock: 10 },
    { name: 'Hand Sanitizer', category: 'Personal Care', price: 95, unit: 'bottle', minStock: 12 },
    { name: 'Face Mask', category: 'Personal Care', price: 10, unit: 'piece', minStock: 30 },
    { name: 'Surgical Gloves', category: 'Medical Supplies', price: 120, unit: 'box', minStock: 15 },
    { name: 'Thermometer', category: 'Devices', price: 250, unit: 'piece', minStock: 8 },
    { name: 'BP Monitor', category: 'Devices', price: 1490, unit: 'piece', minStock: 5 },
    { name: 'Digital Oximeter', category: 'Devices', price: 850, unit: 'piece', minStock: 5 },
    { name: 'Bandages', category: 'Personal Care', price: 30, unit: 'box', minStock: 15 },
    { name: 'Cotton Roll', category: 'Medical Supplies', price: 40, unit: 'roll', minStock: 15 },
    { name: 'Pain Relief Spray', category: 'Wellness', price: 150, unit: 'can', minStock: 10 },
    { name: 'Antibiotic Ointment', category: 'Ointments', price: 90, unit: 'tube', minStock: 10 },
    { name: 'Baby Diapers', category: 'Baby Care', price: 450, unit: 'pack', minStock: 8 },
    { name: 'Baby Lotion', category: 'Baby Care', price: 180, unit: 'bottle', minStock: 8 },
    { name: 'Protein Powder', category: 'Wellness', price: 1250, unit: 'jar', minStock: 5 }
  ],
  'CLOTHING': [
    { name: "Men's T-Shirt", category: "Men's Wear", price: 399, unit: 'piece', minStock: 15 },
    { name: 'Polo T-Shirt', category: "Men's Wear", price: 599, unit: 'piece', minStock: 15 },
    { name: 'Formal Shirt', category: "Men's Wear", price: 799, unit: 'piece', minStock: 12 },
    { name: 'Casual Shirt', category: "Men's Wear", price: 699, unit: 'piece', minStock: 12 },
    { name: 'Jeans', category: "Men's Wear", price: 1199, unit: 'piece', minStock: 10 },
    { name: 'Chinos', category: "Men's Wear", price: 999, unit: 'piece', minStock: 10 },
    { name: 'Hoodie', category: "Men's Wear", price: 1499, unit: 'piece', minStock: 8 },
    { name: 'Jacket', category: "Men's Wear", price: 2499, unit: 'piece', minStock: 5 },
    { name: "Women's Kurti", category: "Women's Wear", price: 899, unit: 'piece', minStock: 12 },
    { name: 'Saree', category: "Women's Wear", price: 2999, unit: 'piece', minStock: 5 },
    { name: 'Leggings', category: "Women's Wear", price: 299, unit: 'piece', minStock: 15 },
    { name: 'Dress', category: "Women's Wear", price: 1299, unit: 'piece', minStock: 10 },
    { name: 'Kids Dress', category: 'Kids Wear', price: 499, unit: 'piece', minStock: 10 },
    { name: 'Sneakers', category: 'Footwear', price: 1899, unit: 'pair', minStock: 6 },
    { name: 'Sandals', category: 'Footwear', price: 799, unit: 'pair', minStock: 10 },
    { name: 'Belt', category: 'Accessories', price: 450, unit: 'piece', minStock: 10 },
    { name: 'Wallet', category: 'Accessories', price: 590, unit: 'piece', minStock: 10 },
    { name: 'Handbag', category: 'Accessories', price: 1490, unit: 'piece', minStock: 8 },
    { name: 'Cap', category: 'Accessories', price: 250, unit: 'piece', minStock: 12 },
    { name: 'Socks', category: 'Accessories', price: 150, unit: 'pair', minStock: 15 }
  ],
  'HARDWARE': [
    { name: 'Cement Bag', category: 'Construction', price: 450, unit: 'bag', minStock: 8 },
    { name: 'Steel Rod', category: 'Construction', price: 1200, unit: 'piece', minStock: 8 },
    { name: 'PVC Pipe', category: 'Plumbing', price: 180, unit: 'piece', minStock: 12 },
    { name: 'GI Pipe', category: 'Plumbing', price: 350, unit: 'piece', minStock: 8 },
    { name: 'Electric Wire', category: 'Electrical', price: 499, unit: 'coil', minStock: 10 },
    { name: 'Switch Board', category: 'Electrical', price: 180, unit: 'piece', minStock: 12 },
    { name: 'LED Bulb', category: 'Electrical', price: 120, unit: 'piece', minStock: 15 },
    { name: 'Hammer', category: 'Tools', price: 299, unit: 'piece', minStock: 8 },
    { name: 'Drill Machine', category: 'Tools', price: 2499, unit: 'piece', minStock: 4 },
    { name: 'Screwdriver Set', category: 'Tools', price: 349, unit: 'set', minStock: 10 },
    { name: 'Measuring Tape', category: 'Tools', price: 150, unit: 'piece', minStock: 12 },
    { name: 'Nails', category: 'Fasteners', price: 95, unit: 'box', minStock: 15 },
    { name: 'Screws', category: 'Fasteners', price: 120, unit: 'box', minStock: 15 },
    { name: 'Wall Paint', category: 'Paints', price: 850, unit: 'can', minStock: 5 },
    { name: 'Paint Brush', category: 'Paints', price: 75, unit: 'piece', minStock: 15 },
    { name: 'Pipe Elbow', category: 'Plumbing', price: 35, unit: 'piece', minStock: 20 },
    { name: 'Water Tap', category: 'Plumbing', price: 280, unit: 'piece', minStock: 10 },
    { name: 'Adjustable Wrench', category: 'Tools', price: 450, unit: 'piece', minStock: 8 },
    { name: 'Spanner Set', category: 'Tools', price: 650, unit: 'set', minStock: 6 },
    { name: 'Safety Helmet', category: 'Safety', price: 320, unit: 'piece', minStock: 10 }
  ],
  'ELECTRONICS': [
    { name: 'Samsung Galaxy Phone', category: 'Smartphones', price: 34900, unit: 'piece', minStock: 3 },
    { name: 'Apple iPhone', category: 'Smartphones', price: 79900, unit: 'piece', minStock: 2 },
    { name: 'OnePlus Smartphone', category: 'Smartphones', price: 42000, unit: 'piece', minStock: 3 },
    { name: 'HP Laptop', category: 'Laptops', price: 45000, unit: 'piece', minStock: 3 },
    { name: 'Lenovo Laptop', category: 'Laptops', price: 38000, unit: 'piece', minStock: 3 },
    { name: 'Dell Laptop', category: 'Laptops', price: 48000, unit: 'piece', minStock: 3 },
    { name: 'Smart TV', category: 'Entertainment', price: 19999, unit: 'piece', minStock: 2 },
    { name: 'Bluetooth Speaker', category: 'Audio Devices', price: 1490, unit: 'piece', minStock: 5 },
    { name: 'Wireless Earbuds', category: 'Audio Devices', price: 1999, unit: 'piece', minStock: 5 },
    { name: 'Headphones', category: 'Audio Devices', price: 2490, unit: 'piece', minStock: 5 },
    { name: 'Smart Watch', category: 'Wearables', price: 3990, unit: 'piece', minStock: 4 },
    { name: 'Wireless Mouse', category: 'Accessories', price: 499, unit: 'piece', minStock: 10 },
    { name: 'Mechanical Keyboard', category: 'Accessories', price: 1899, unit: 'piece', minStock: 8 },
    { name: 'USB Cable', category: 'Accessories', price: 199, unit: 'piece', minStock: 15 },
    { name: 'HDMI Cable', category: 'Accessories', price: 299, unit: 'piece', minStock: 15 },
    { name: 'Power Bank', category: 'Accessories', price: 1290, unit: 'piece', minStock: 5 },
    { name: 'Fast Charger', category: 'Accessories', price: 699, unit: 'piece', minStock: 8 },
    { name: 'Wi-Fi Router', category: 'Networking', price: 2100, unit: 'piece', minStock: 5 },
    { name: 'External SSD', category: 'Storage', price: 6500, unit: 'piece', minStock: 4 },
    { name: 'Webcam', category: 'Accessories', price: 1590, unit: 'piece', minStock: 6 }
  ]
};

// Map similar business types to our 5 catalogs
export function getCatalogForType(type: string): string {
  const norm = type.toUpperCase();
  if (norm.includes('PHARMACY') || norm.includes('MEDICAL')) return 'PHARMACY';
  if (norm.includes('CLOTHING') || norm.includes('APPAREL') || norm.includes('TRENDS')) return 'CLOTHING';
  if (norm.includes('HARDWARE') || norm.includes('BUILD')) return 'HARDWARE';
  if (norm.includes('ELECTRONIC') || norm.includes('TECH')) return 'ELECTRONICS';
  return 'GROCERY'; // Default
}

export function getExactStarterProducts(businessType: string): Array<{ name: string; category: string; price: number; unit: string; minStock: number }> {
  const catalogKey = getCatalogForType(businessType);
  return BUSINESS_CATALOGS[catalogKey] || BUSINESS_CATALOGS['GROCERY'];
}

export function initializeDatabase(config?: {
  businessType: string;
  businessName: string;
  ownerName: string;
  address: string;
  phone: string;
  gstNumber?: string;
  currency: string;
  language: string;
  employees: number;
  email?: string;
  logo?: string;
  customProducts?: Array<{ name: string; category: string; price: number; unit: string; minStock: number }>;
  userId?: string;
}) {
  console.log('Seeding database with configuration:', config);

  const selectedKey = config ? getCatalogForType(config.businessType) : 'GROCERY';
  const rawProducts = BUSINESS_CATALOGS[selectedKey] || BUSINESS_CATALOGS['GROCERY'];

  // Helper to determine GST rate based on name/category
  const getGstRate = (name: string, cat: string): number => {
    const lower = name.toLowerCase();
    const catLower = cat.toLowerCase();
    if (catLower.includes('pharmacy') || catLower.includes('tablet') || catLower.includes('syrup') || catLower.includes('medicine') || catLower.includes('device') || catLower.includes('supplies') || catLower.includes('ointment')) return 12;
    if (catLower.includes('electronic') || catLower.includes('laptop') || catLower.includes('audio') || catLower.includes('wearable') || catLower.includes('networking') || catLower.includes('smartphone') || catLower.includes('entertainment') || catLower.includes('electrical') || catLower.includes('accessories')) return 18;
    if (lower.includes('water') || lower.includes('milk') || lower.includes('curd') || lower.includes('tomato') || lower.includes('potato') || lower.includes('onion') || lower.includes('apple') || lower.includes('banana') || lower.includes('orange') || lower.includes('carrot') || lower.includes('spinach') || lower.includes('cucumber') || lower.includes('mango') || lower.includes('egg')) return 0;
    if (lower.includes('rice') || lower.includes('atta') || lower.includes('sugar') || lower.includes('paneer') || lower.includes('ghee') || lower.includes('wheat') || lower.includes('flour') || lower.includes('dal') || lower.includes('pulses')) return 5;
    return 12; // Standard rate
  };

  // Helper to generate a realistic supplier based on category
  const getSupplier = (cat: string): string => {
    return `${cat} Wholesale Distributors India`;
  };

  // Helper to generate future expiry dates for food & pharmaceuticals
  const getExpiryDate = (cat: string): string | undefined => {
    const catLower = cat.toLowerCase();
    if (['grocery', 'dairy', 'snacks', 'fruits', 'vegetables', 'beverages', 'pulses', 'rice', 'flour', 'sugar', 'salt', 'cooking oil'].some(c => catLower.includes(c))) {
      const future = new Date();
      const days = catLower.includes('fruit') || catLower.includes('vegetable') ? 7 : 180;
      future.setDate(future.getDate() + days);
      return future.toISOString().split('T')[0];
    }
    if (['pharmacy', 'tablet', 'syrup', 'medicine', 'ointment', 'baby care', 'wellness', 'medical supplies'].some(c => catLower.includes(c))) {
      const future = new Date();
      future.setDate(future.getDate() + 540); // medicines expire in 1.5 years
      return future.toISOString().split('T')[0];
    }
    return undefined;
  };

  // Determine base products list based on customProducts or template catalog
  let baseProductsList: Array<{ name: string; category: string; price: number; unit: string; minStock: number }> = [];

  if (config && config.customProducts && config.customProducts.length > 0) {
    baseProductsList = [...config.customProducts];
  } else if (config && config.businessType) {
    baseProductsList = getExactStarterProducts(config.businessType);
  } else {
    baseProductsList = [...rawProducts];
  }

  // To meet the requirement of AT LEAST 100 realistic products, let's expand the baseProductsList up to 105 products
  const targetCount = 105;
  const expandedProductsList = [...baseProductsList];
  
  let brands: string[] = [];
  let sizes: string[] = [];
  let weights: string[] = [];
  let brandRegex: RegExp = /Amul|Tata|Colgate|Fortune|Maggi|Parle-G|Britannia|Surf Excel|Aashirvaad|India Gate/gi;

  if (selectedKey === 'PHARMACY') {
    brands = ['Cipla', 'Abbott', 'Sun Pharma', 'Dr. Reddy\'s', 'Lupin', 'Glenmark', 'Dettol', 'Himalaya', 'Patanjali', 'Johnson & Johnson', 'GSK', 'Pfizer', 'Vicks', 'Nivea'];
    sizes = ['Standard Box', 'Travel Pack', 'Single Strip', 'Daily Dose', 'Value Pack', 'Extra Strength', 'Kids Formula', 'Doctor Recommend'];
    weights = ['10 Tablets', '15 Tablets', '100mg', '250mg', '500mg', '650mg', '50ml', '100ml', '200ml', '100g', '200g', 'Pack of 2', 'Pack of 10'];
    brandRegex = /Cipla|Abbott|Sun Pharma|Dr\. Reddy's|Lupin|Glenmark|Dettol|Himalaya|Patanjali|Johnson & Johnson|GSK|Pfizer|Vicks|Nivea|Paracetamol|Cetirizine/gi;
  } else if (selectedKey === 'CLOTHING') {
    brands = ['Zudio', 'Levis', 'Peter England', 'Allen Solly', 'Zara', 'H&M', 'Manyavar', 'Raymond', 'Van Heusen', 'Puma', 'Adidas', 'Nike', 'FabIndia', 'Wrangler', 'Pepe Jeans'];
    sizes = ['Size S', 'Size M', 'Size L', 'Size XL', 'Size XXL', 'Regular Fit', 'Slim Fit', 'Comfort Fit', 'Athletic Fit'];
    weights = ['Classic Black', 'Navy Blue', 'Olive Green', 'Crimson Red', 'Striped', 'Checkered', 'Printed', 'Solid Color'];
    brandRegex = /Zudio|Levis|Peter England|Allen Solly|Zara|H&M|Manyavar|Raymond|Van Heusen|Puma|Adidas|Nike|FabIndia|Wrangler|Pepe Jeans/gi;
  } else if (selectedKey === 'HARDWARE') {
    brands = ['UltraTech', 'Tata Steel', 'Supreme PVC', 'Asian Paints', 'Berger', 'Havells', 'Anchor', 'Bosch', 'Stanley', 'Taparia', 'Fevicol', 'Dr. Fixit', 'Finolex', 'Polycab', 'Kirloskar'];
    sizes = ['Heavy Duty', 'Standard Grade', 'Pro Series', 'Industrial Strength', 'Compact Design', 'Utility Grade', 'Contractor Pack'];
    weights = ['1 inch', '2 inch', '4 inch', '10mm', '12mm', '16mm', '500g', '1kg', '5kg', '10kg', '50kg', '1 meter', '5 meter', '10 meter', 'Pack of 50', 'Pack of 100'];
    brandRegex = /UltraTech|Tata Steel|Supreme PVC|Asian Paints|Berger|Havells|Anchor|Bosch|Stanley|Taparia|Fevicol|Dr\. Fixit|Finolex|Polycab|Kirloskar|Cement|Steel|PVC/gi;
  } else if (selectedKey === 'ELECTRONICS') {
    brands = ['Samsung', 'Apple', 'OnePlus', 'HP', 'Dell', 'Lenovo', 'Sony', 'Xiaomi', 'boAt', 'JBL', 'Realme', 'SanDisk', 'TP-Link', 'Anker', 'Logitech'];
    sizes = ['Pro Max', 'Lite Edition', 'Plus Version', 'Ultra Slim', 'Wireless', 'Type-C', 'High Speed', 'Gen 2', 'RGB Backlit'];
    weights = ['128GB', '256GB', '512GB', '1TB', '64GB', '8GB RAM', '16GB RAM', '10000mAh', '20000mAh', '1.5 meter', '2 meter', '32-inch', '43-inch', '55-inch'];
    brandRegex = /Samsung|Apple|OnePlus|HP|Dell|Lenovo|Sony|Xiaomi|boAt|JBL|Realme|SanDisk|TP-Link|Anker|Logitech/gi;
  } else {
    // GROCERY
    brands = ['Amul', 'Tata', 'Aashirvaad', 'Fortune', 'Maggi', 'Parle-G', 'Britannia', 'Surf Excel', 'Saffola', 'MDH', 'MTR', 'Cadbury', 'Nestle', 'Haldiram', 'Catch', 'Everest', 'Colgate', 'Dettol'];
    sizes = ['Small Pack', 'Medium Jar', 'Family Pack', 'Combo Duo', 'Value Tub', 'Premium Select', 'Eco Pack', 'Super Saver'];
    weights = ['50g', '100g', '200g', '500g', '1kg', '2kg', '5kg', '10kg', '25kg', '100ml', '200ml', '500ml', '1L', '2L', '5L', 'Pack of 4'];
    brandRegex = /Amul|Tata|Colgate|Fortune|Maggi|Parle-G|Britannia|Surf Excel|Aashirvaad|India Gate/gi;
  }

  let safetyCount = 0;
  while (expandedProductsList.length < targetCount && safetyCount < 2000) {
    safetyCount++;
    const sourceProd = baseProductsList[Math.floor(Math.random() * baseProductsList.length)];
    const randomBrand = brands[Math.floor(Math.random() * brands.length)];
    const randomSize = sizes[Math.floor(Math.random() * sizes.length)];
    const randomWeight = weights[Math.floor(Math.random() * weights.length)];
    
    // Create variation name
    let cleanedName = sourceProd.name
      .replace(/\d+(kg|g|l|ml|s| Tablets|mg|GB|TB|mAh|inch|mm|meter|L)/gi, '')
      .replace(/\s-Pack/g, '')
      .replace(/\(.*\)/g, '')
      .replace(brandRegex, '')
      .trim();
    
    let varName = '';
    if (selectedKey === 'CLOTHING') {
      varName = `${randomBrand} ${cleanedName} - ${randomWeight} (${randomSize})`;
    } else {
      varName = `${randomBrand} ${cleanedName} ${randomWeight} (${randomSize})`;
    }
    
    if (!expandedProductsList.some(p => p.name.toLowerCase() === varName.toLowerCase())) {
      // Adjust price slightly based on weight variation so it is realistic
      let priceMultiplier = 1;
      if (randomWeight.includes('kg') || randomWeight.includes('L') || randomWeight.includes('TB') || randomWeight.includes('5kg') || randomWeight.includes('10kg') || randomWeight.includes('50kg')) {
        const val = parseInt(randomWeight) || 1;
        priceMultiplier = val > 0 ? val * 0.85 : 1.5;
      } else if (randomWeight.includes('500g') || randomWeight.includes('500ml') || randomWeight.includes('256GB') || randomWeight.includes('512GB')) {
        priceMultiplier = 1.35;
      } else if (randomWeight.includes('200g') || randomWeight.includes('200ml') || randomWeight.includes('128GB')) {
        priceMultiplier = 1.0;
      } else if (randomWeight.includes('50g') || randomWeight.includes('50ml') || randomWeight.includes('100g') || randomWeight.includes('100ml') || randomWeight.includes('64GB')) {
        priceMultiplier = 0.75;
      } else if (randomWeight.includes('Pack')) {
        priceMultiplier = 1.75;
      }
      
      const price = Math.max(10, Math.round(sourceProd.price * priceMultiplier));
      expandedProductsList.push({
        name: varName,
        category: sourceProd.category,
        price,
        unit: sourceProd.unit || 'piece',
        minStock: sourceProd.minStock || 5
      });
    }
  }

  // 1. Generate Products tailored to this business
  const products: Product[] = expandedProductsList.map((p, idx) => {
    // Make 30% of products low stock to create interesting diagnostics immediately!
    const isLow = idx % 3 === 0;
    const quantity = isLow ? Math.floor(Math.random() * (p.minStock - 1)) + 1 : Math.floor(Math.random() * 40) + p.minStock + 12;
    
    const buyingPrice = Math.round(p.price * 0.65);
    const sellingPrice = p.price;
    const profitMargin = 35; // 35% margin
    const gst = getGstRate(p.name, p.category);
    
    const suffix = String(1000 + idx).substring(1);
    const barcode = `890${suffix}${Math.floor(100000000 + Math.random() * 900000000)}`;
    const sku = `VM-${selectedKey.substring(0, 3)}-${100 + idx}`;
    const qrCode = `VM-QR-${sku}`;

    return {
      id: `p${idx + 1}`,
      name: p.name,
      category: p.category,
      barcode,
      qrCode,
      sku,
      quantity,
      buyingPrice,
      sellingPrice,
      profitMargin,
      gst,
      supplier: getSupplier(p.category),
      expiryDate: getExpiryDate(p.category),
      unit: p.unit,
      status: quantity === 0 ? 'OUT_OF_STOCK' : quantity <= p.minStock ? 'LOW_STOCK' : 'IN_STOCK',
      minStock: p.minStock
    };
  });

  // 2. Generate 50 Customers
  const customers: Customer[] = [];
  for (let i = 1; i <= 60; i++) {
    const fName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    let lName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    if (customers.some(c => c.name === `${fName} ${lName}`)) {
      lName = LAST_NAMES[(LAST_NAMES.indexOf(lName) + 1) % LAST_NAMES.length];
    }
    
    const visitCount = Math.floor(Math.random() * 12) + 1;
    const totalPurchases = Math.floor(visitCount * (Math.random() * 800 + 150));
    const isInactive = Math.random() < 0.20; // 20% inactive
    const daysAgo = isInactive ? Math.floor(Math.random() * 60) + 46 : Math.floor(Math.random() * 45);
    const lastVisit = randomDate(daysAgo);

    customers.push({
      id: `c${i}`,
      name: `${fName} ${lName}`,
      phone: generatePhone(),
      email: `${fName.toLowerCase()}.${lName.toLowerCase()}@gmail.com`,
      lastVisit,
      totalPurchases: Math.round(totalPurchases),
      status: isInactive ? 'INACTIVE' : 'ACTIVE',
      visitCount
    });
  }

  // Ensure core customers exist for standard AI tests
  const ownerName = config ? config.ownerName : 'Business Owner';
  const coreUsers = [
    { name: 'Rajesh Kumar', phone: '+91 98765 43210', email: 'rajesh.kumar@gmail.com', lastVisit: randomDate(50), totalPurchases: 12500, status: 'INACTIVE', visitCount: 14 },
    { name: 'Priya Patel', phone: '+91 98123 45678', email: 'priya.patel@gmail.com', lastVisit: randomDate(5), totalPurchases: 24500, status: 'ACTIVE', visitCount: 22 },
    { name: 'Amit Sharma', phone: '+91 97654 32109', email: 'amit.sharma@gmail.com', lastVisit: randomDate(48), totalPurchases: 8900, status: 'INACTIVE', visitCount: 8 },
    { name: 'Sunita Rao', phone: '+91 99887 76655', email: 'sunita.rao@gmail.com', lastVisit: randomDate(2), totalPurchases: 18600, status: 'ACTIVE', visitCount: 15 }
  ];

  coreUsers.forEach((user, idx) => {
    customers[idx] = {
      id: `c_core_${idx + 1}`,
      name: user.name,
      phone: user.phone,
      email: user.email,
      lastVisit: user.lastVisit,
      totalPurchases: user.totalPurchases,
      status: user.status as 'ACTIVE' | 'INACTIVE',
      visitCount: user.visitCount
    };
  });

  // 3. Generate 70 historical sales ledger over the last 30 days using *only* products of this business!
  const sales: Sale[] = [];
  const invoices: Invoice[] = [];
  
  for (let i = 1; i <= 75; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const itemCount = Math.min(products.length, Math.floor(Math.random() * 3) + 1);
    const selectedProducts: any[] = [];
    let subtotal = 0;
    let totalTax = 0;

    // Pick unique products
    const shuffledProducts = [...products].sort(() => 0.5 - Math.random());
    for (let k = 0; k < itemCount; k++) {
      const prod = shuffledProducts[k];
      const qty = Math.floor(Math.random() * 2) + 1;
      const total = qty * prod.sellingPrice;
      const gstAmt = Math.round(total * (prod.gst / 100));
      selectedProducts.push({
        productId: prod.id,
        name: prod.name,
        quantity: qty,
        price: prod.sellingPrice,
        total,
        gstRate: prod.gst,
        gstAmount: gstAmt
      });
      subtotal += total;
      totalTax += gstAmt;
    }

    const total = subtotal + totalTax;
    
    const daysAgo = Math.floor(Math.random() * 30);
    const sDate = randomDate(daysAgo);
    const invoiceNum = `VM-${1000 + i}`;

    const paymentMethods: Array<'CASH' | 'CARD' | 'UPI' | 'DUE'> = ['UPI', 'CASH', 'UPI', 'CARD', 'DUE'];
    const pm = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

    sales.push({
      id: `s${i}`,
      invoiceNumber: invoiceNum,
      customerId: customer.id,
      customerName: customer.name,
      date: sDate,
      products: selectedProducts,
      subtotal,
      tax: totalTax,
      total,
      paymentMethod: pm === 'DUE' ? 'DUE' : pm
    });

    invoices.push({
      id: `inv${i}`,
      invoiceNumber: invoiceNum,
      customerName: customer.name,
      customerPhone: customer.phone,
      date: sDate,
      products: selectedProducts,
      subtotal,
      tax: totalTax,
      total,
      status: pm === 'DUE' ? 'UNPAID' : 'PAID'
    });
  }

  // Sort them so recent sales are indeed first
  sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  invoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Set default metadata
  const defaultMeta = {
    businessType: config ? config.businessType : 'Grocery Store / Supermarket',
    businessName: config ? config.businessName : 'VyaparaMitra Retail',
    ownerName: ownerName,
    address: config ? config.address : 'Plot 42, HSR Layout, Bengaluru, Karnataka, India',
    phone: config ? config.phone : '+91 99999 99999',
    gstNumber: config ? config.gstNumber : '29AAABP4211G1Z3',
    currency: config ? config.currency : 'INR',
    language: config ? config.language : 'English',
    employees: config ? config.employees : 5,
    email: config && config.email ? config.email : 'owner@vyaparamitra.com',
    logo: config && config.logo ? config.logo : 'icon_blue',
    setupCompleted: !!config
  };

  // Seed default users for authentication
  const defaultUsers = [
    {
      id: 'u_owner',
      username: 'owner',
      passwordHash: '8681e1866388ffc736551b14cb6982f6e9b8602b667eef090d8502f0fc9e66ff', // pbkdf2 of 'password123' with salt 'demo_salt'
      salt: 'demo_salt',
      name: ownerName + ' (Owner)',
      role: 'Business Owner',
      email: config ? (config as any).email : 'owner@vyaparamitra.com'
    },
    {
      id: 'u_manager',
      username: 'manager',
      passwordHash: '8681e1866388ffc736551b14cb6982f6e9b8602b667eef090d8502f0fc9e66ff',
      salt: 'demo_salt',
      name: 'Karan Singh',
      role: 'Manager',
      email: 'manager@vyaparamitra.com'
    },
    {
      id: 'u_employee',
      username: 'employee',
      passwordHash: '8681e1866388ffc736551b14cb6982f6e9b8602b667eef090d8502f0fc9e66ff',
      salt: 'demo_salt',
      name: 'Rahul Verma',
      role: 'Employee',
      email: 'employee@vyaparamitra.com'
    }
  ];

  // If config has userId, let's load current database instead of wiping everything!
  const targetUserId = config?.userId;
  if (targetUserId) {
    let currentDb: any;
    try {
      if (fs.existsSync(DB_FILE)) {
        currentDb = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      } else {
        currentDb = { products: [], customers: [], sales: [], invoices: [], users: [], metadataList: [] };
      }
    } catch {
      currentDb = { products: [], customers: [], sales: [], invoices: [], users: [], metadataList: [] };
    }

    if (!currentDb.products) currentDb.products = [];
    if (!currentDb.customers) currentDb.customers = [];
    if (!currentDb.sales) currentDb.sales = [];
    if (!currentDb.invoices) currentDb.invoices = [];
    if (!currentDb.expenses) currentDb.expenses = [];
    if (!currentDb.metadataList) currentDb.metadataList = [];
    if (!currentDb.users) currentDb.users = [];

    // Filter out old entries for this specific userId
    const filterOutUser = (item: any) => (item.userId || 'u_owner') !== targetUserId;
    currentDb.products = currentDb.products.filter(filterOutUser);
    currentDb.customers = currentDb.customers.filter(filterOutUser);
    currentDb.sales = currentDb.sales.filter(filterOutUser);
    currentDb.invoices = currentDb.invoices.filter(filterOutUser);
    currentDb.expenses = currentDb.expenses.filter(filterOutUser);
    currentDb.metadataList = currentDb.metadataList.filter((m: any) => (m.userId || 'u_owner') !== targetUserId);

    // Assign userId to all newly generated entities
    const userProducts = products.map((p: any) => ({ ...p, userId: targetUserId }));
    const userCustomers = customers.map((c: any) => ({ ...c, userId: targetUserId }));
    const userSales = sales.map((s: any) => ({ ...s, userId: targetUserId }));
    const userInvoices = invoices.map((i: any) => ({ ...i, userId: targetUserId }));
    const userExpenses = generateDefaultExpenses(targetUserId);

    // Append to existing database
    currentDb.products.unshift(...userProducts);
    currentDb.customers.unshift(...userCustomers);
    currentDb.sales.unshift(...userSales);
    currentDb.invoices.unshift(...userInvoices);
    currentDb.expenses.unshift(...userExpenses);

    // Save user metadata
    const userMeta = {
      businessType: config.businessType,
      businessName: config.businessName,
      ownerName: config.ownerName || 'Business Owner',
      address: config.address || 'HSR Layout, Bengaluru',
      phone: config.phone || '+91 99999 99999',
      gstNumber: config.gstNumber || '',
      currency: config.currency || 'INR',
      language: config.language || 'English',
      employees: config.employees || 5,
      email: config.email || '',
      logo: config.logo || 'icon_blue',
      setupCompleted: true,
      userId: targetUserId
    };
    currentDb.metadataList.push(userMeta);

    // Save back to file
    fs.writeFileSync(DB_FILE, JSON.stringify(currentDb, null, 2), 'utf-8');
    console.log(`User-specific database seeded successfully for userId: ${targetUserId}`);
    return currentDb;
  }

  const dataStore = {
    products,
    customers,
    sales,
    invoices,
    expenses: generateDefaultExpenses('u_owner'),
    users: defaultUsers,
    metadata: defaultMeta,
    metadataList: []
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(dataStore, null, 2), 'utf-8');
  console.log(`Database seeded successfully for industry: ${defaultMeta.businessType}`);
  return dataStore;
}

export function loadDatabase() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      return initializeDatabase();
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    
    // Check back compatibility for users
    if (!parsed.users) {
      parsed.users = [
        {
          id: 'u_owner',
          username: 'owner',
          passwordHash: '8681e1866388ffc736551b14cb6982f6e9b8602b667eef090d8502f0fc9e66ff',
          salt: 'demo_salt',
          name: (parsed.metadata?.ownerName || 'Business Owner') + ' (Owner)',
          role: 'Business Owner',
          email: 'owner@vyaparamitra.com'
        },
        {
          id: 'u_manager',
          username: 'manager',
          passwordHash: '8681e1866388ffc736551b14cb6982f6e9b8602b667eef090d8502f0fc9e66ff',
          salt: 'demo_salt',
          name: 'Karan Singh',
          role: 'Manager',
          email: 'manager@vyaparamitra.com'
        },
        {
          id: 'u_employee',
          username: 'employee',
          passwordHash: '8681e1866388ffc736551b14cb6982f6e9b8602b667eef090d8502f0fc9e66ff',
          salt: 'demo_salt',
          name: 'Rahul Verma',
          role: 'Employee',
          email: 'employee@vyaparamitra.com'
        }
      ];
      saveDatabase(parsed);
    }

    // Backward compatibility for metadata
    if (!parsed.metadata) {
      parsed.metadata = {
        businessType: 'Grocery Store / Supermarket',
        businessName: 'VyaparaMitra Retail',
        ownerName: 'Business Owner',
        address: 'Plot 42, HSR Layout, Bengaluru, Karnataka, India',
        phone: '+91 99999 99999',
        gstNumber: '29AAABP4211G1Z3',
        currency: 'INR',
        language: 'English',
        employees: 5,
        setupCompleted: false
      };
      saveDatabase(parsed);
    }
    if (!parsed.metadataList) {
      parsed.metadataList = [];
      saveDatabase(parsed);
    }
    if (!parsed.expenses) {
      parsed.expenses = generateDefaultExpenses('u_owner');
      saveDatabase(parsed);
    }
    return parsed;
  } catch (error) {
    console.error('Error loading database, reinitializing...', error);
    return initializeDatabase();
  }
}

export function saveDatabase(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving database:', error);
  }
}
