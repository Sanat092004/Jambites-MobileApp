import { Router, type IRouter } from "express";

const router: IRouter = Router();

const VENDORS = [
  {
    id: "vendor-1",
    name: "Sharma Ji Ke Samose",
    description: "Crispy samosas, kachori & chai since 1985",
    rating: 4.7,
    deliveryTimeMin: 5,
    deliveryFee: 15,
    distance: 0.3,
    isOpen: true,
    category: "Snacks",
    imageUrl: "",
  },
  {
    id: "vendor-2",
    name: "Chai Point Express",
    description: "Masala chai, coffee, cold drinks & biscuits",
    rating: 4.5,
    deliveryTimeMin: 4,
    deliveryFee: 10,
    distance: 0.5,
    isOpen: true,
    category: "Drinks",
    imageUrl: "",
  },
  {
    id: "vendor-3",
    name: "Quick Meds",
    description: "Essential medicines, ORS, Paracetamol, antacids",
    rating: 4.8,
    deliveryTimeMin: 6,
    deliveryFee: 20,
    distance: 0.8,
    isOpen: true,
    category: "Medicines",
    imageUrl: "",
  },
  {
    id: "vendor-4",
    name: "Burger Bros",
    description: "Veg & non-veg burgers, fries, shakes",
    rating: 4.3,
    deliveryTimeMin: 7,
    deliveryFee: 20,
    distance: 1.1,
    isOpen: true,
    category: "Snacks",
    imageUrl: "",
  },
  {
    id: "vendor-5",
    name: "Healthy Bites",
    description: "Fruit bowls, protein bars, energy drinks",
    rating: 4.4,
    deliveryTimeMin: 5,
    deliveryFee: 15,
    distance: 0.7,
    isOpen: false,
    category: "Snacks",
    imageUrl: "",
  },
];

const MENUS: Record<string, { vendor: (typeof VENDORS)[0]; sections: Array<{ title: string; items: Array<{ id: string; name: string; description: string; price: number; category: string; isVeg: boolean; isBestseller: boolean; imageUrl: string }> }> }> = {
  "vendor-1": {
    vendor: VENDORS[0],
    sections: [
      {
        title: "Snacks",
        items: [
          { id: "v1-s1", name: "Aloo Samosa", description: "Crispy pastry with spiced potato filling", price: 15, category: "Snacks", isVeg: true, isBestseller: true, imageUrl: "" },
          { id: "v1-s2", name: "Paneer Kachori", description: "Flaky pastry stuffed with spiced paneer", price: 20, category: "Snacks", isVeg: true, isBestseller: false, imageUrl: "" },
          { id: "v1-s3", name: "Pyaaz Kachori", description: "Classic onion kachori with chutney", price: 15, category: "Snacks", isVeg: true, isBestseller: true, imageUrl: "" },
          { id: "v1-s4", name: "Combo Pack (4 Samosas)", description: "4 samosas with mint & tamarind chutney", price: 55, category: "Snacks", isVeg: true, isBestseller: false, imageUrl: "" },
        ],
      },
      {
        title: "Drinks",
        items: [
          { id: "v1-d1", name: "Masala Chai", description: "Hot ginger tea with spices", price: 15, category: "Drinks", isVeg: true, isBestseller: true, imageUrl: "" },
          { id: "v1-d2", name: "Lassi (Sweet)", description: "Thick yogurt drink", price: 30, category: "Drinks", isVeg: true, isBestseller: false, imageUrl: "" },
          { id: "v1-d3", name: "Nimbu Pani", description: "Fresh lime water with salt & sugar", price: 20, category: "Drinks", isVeg: true, isBestseller: false, imageUrl: "" },
        ],
      },
    ],
  },
  "vendor-2": {
    vendor: VENDORS[1],
    sections: [
      {
        title: "Hot Drinks",
        items: [
          { id: "v2-h1", name: "Classic Masala Chai", description: "Signature blend with cardamom & ginger", price: 20, category: "Drinks", isVeg: true, isBestseller: true, imageUrl: "" },
          { id: "v2-h2", name: "Filter Coffee", description: "South Indian filter coffee", price: 25, category: "Drinks", isVeg: true, isBestseller: true, imageUrl: "" },
          { id: "v2-h3", name: "Green Tea", description: "Light & refreshing", price: 30, category: "Drinks", isVeg: true, isBestseller: false, imageUrl: "" },
        ],
      },
      {
        title: "Cold Drinks",
        items: [
          { id: "v2-c1", name: "Iced Coffee", description: "Cold brew with milk", price: 60, category: "Drinks", isVeg: true, isBestseller: false, imageUrl: "" },
          { id: "v2-c2", name: "Cold Masala Chai", description: "Chilled spiced tea", price: 50, category: "Drinks", isVeg: true, isBestseller: true, imageUrl: "" },
          { id: "v2-c3", name: "Fresh Lime Soda", description: "Sparkling lime with mint", price: 40, category: "Drinks", isVeg: true, isBestseller: false, imageUrl: "" },
        ],
      },
      {
        title: "Snacks",
        items: [
          { id: "v2-s1", name: "Biscuit Pack", description: "Assorted cream biscuits", price: 10, category: "Snacks", isVeg: true, isBestseller: false, imageUrl: "" },
          { id: "v2-s2", name: "Rusks", description: "Crispy toast for chai dunking", price: 15, category: "Snacks", isVeg: true, isBestseller: false, imageUrl: "" },
        ],
      },
    ],
  },
  "vendor-3": {
    vendor: VENDORS[2],
    sections: [
      {
        title: "Fever & Pain",
        items: [
          { id: "v3-m1", name: "Crocin (10 tabs)", description: "Paracetamol 500mg", price: 25, category: "Medicines", isVeg: true, isBestseller: true, imageUrl: "" },
          { id: "v3-m2", name: "Dolo 650 (10 tabs)", description: "Paracetamol 650mg", price: 35, category: "Medicines", isVeg: true, isBestseller: false, imageUrl: "" },
          { id: "v3-m3", name: "Disprin (10 tabs)", description: "Aspirin effervescent tablets", price: 20, category: "Medicines", isVeg: true, isBestseller: false, imageUrl: "" },
        ],
      },
      {
        title: "Digestion & Hydration",
        items: [
          { id: "v3-d1", name: "Electral ORS (pack)", description: "Oral rehydration salts", price: 30, category: "Medicines", isVeg: true, isBestseller: true, imageUrl: "" },
          { id: "v3-d2", name: "Pudin Hara (pack)", description: "Digestive drops, 10ml", price: 40, category: "Medicines", isVeg: true, isBestseller: false, imageUrl: "" },
          { id: "v3-d3", name: "Eno Sachet (2pcs)", description: "Antacid powder", price: 15, category: "Medicines", isVeg: true, isBestseller: true, imageUrl: "" },
        ],
      },
    ],
  },
  "vendor-4": {
    vendor: VENDORS[3],
    sections: [
      {
        title: "Burgers",
        items: [
          { id: "v4-b1", name: "Veg Classic Burger", description: "Aloo tikki patty with lettuce & sauce", price: 80, category: "Snacks", isVeg: true, isBestseller: true, imageUrl: "" },
          { id: "v4-b2", name: "Paneer Burger", description: "Grilled paneer with jalapeños", price: 110, category: "Snacks", isVeg: true, isBestseller: false, imageUrl: "" },
          { id: "v4-b3", name: "Chicken Burger", description: "Crispy chicken patty with mayo", price: 130, category: "Snacks", isVeg: false, isBestseller: true, imageUrl: "" },
        ],
      },
      {
        title: "Sides",
        items: [
          { id: "v4-s1", name: "French Fries", description: "Golden crispy fries with ketchup", price: 60, category: "Snacks", isVeg: true, isBestseller: true, imageUrl: "" },
          { id: "v4-s2", name: "Onion Rings", description: "Battered onion rings", price: 70, category: "Snacks", isVeg: true, isBestseller: false, imageUrl: "" },
        ],
      },
    ],
  },
  "vendor-5": {
    vendor: VENDORS[4],
    sections: [
      {
        title: "Healthy Bites",
        items: [
          { id: "v5-h1", name: "Fruit Bowl", description: "Seasonal fruit mix with chaat masala", price: 80, category: "Snacks", isVeg: true, isBestseller: true, imageUrl: "" },
          { id: "v5-h2", name: "Protein Bar", description: "High-protein energy bar", price: 70, category: "Snacks", isVeg: true, isBestseller: false, imageUrl: "" },
          { id: "v5-h3", name: "Energy Drink", description: "Glucose-based energy drink", price: 50, category: "Drinks", isVeg: true, isBestseller: false, imageUrl: "" },
        ],
      },
    ],
  },
};

router.get("/jambites/vendors", (req, res) => {
  res.json(VENDORS);
});

router.get("/jambites/vendors/:vendorId/menu", (req, res) => {
  const { vendorId } = req.params;
  const menu = MENUS[vendorId];
  if (!menu) {
    res.status(404).json({ error: "Vendor not found" });
    return;
  }
  res.json(menu);
});

let orderCounter = 1000;

router.post("/jambites/orders", (req, res) => {
  const { vendorId, items, deliveryLat, deliveryLng, landmark, carNumber, paymentMethod } = req.body;

  const vendor = VENDORS.find((v) => v.id === vendorId);
  if (!vendor) {
    res.status(404).json({ error: "Vendor not found" });
    return;
  }

  const menu = MENUS[vendorId];
  let totalAmount = 0;
  if (menu) {
    for (const cartItem of items) {
      for (const section of menu.sections) {
        const menuItem = section.items.find((i) => i.id === cartItem.menuItemId);
        if (menuItem) {
          totalAmount += menuItem.price * cartItem.quantity;
        }
      }
    }
  }
  totalAmount += vendor.deliveryFee + 2;

  orderCounter++;
  const orderId = `ORD-${orderCounter}`;

  const order = {
    id: orderId,
    status: "CONFIRMED",
    vendorId,
    vendorName: vendor.name,
    estimatedMinutes: vendor.deliveryTimeMin,
    totalAmount,
    riderName: "Rajesh Kumar",
    riderPhone: "+91 9876543210",
    riderLat: (deliveryLat || 28.6139) + 0.002,
    riderLng: (deliveryLng || 77.209) + 0.001,
    createdAt: new Date().toISOString(),
  };

  res.status(201).json(order);
});

router.get("/jambites/orders/:orderId", (req, res) => {
  const { orderId } = req.params;
  const order = {
    id: orderId,
    status: "RIDER_ASSIGNED",
    vendorId: "vendor-1",
    vendorName: "Sharma Ji Ke Samose",
    estimatedMinutes: 3,
    totalAmount: 85,
    riderName: "Rajesh Kumar",
    riderPhone: "+91 9876543210",
    riderLat: 28.616,
    riderLng: 77.21,
    createdAt: new Date().toISOString(),
  };
  res.json(order);
});

export default router;
