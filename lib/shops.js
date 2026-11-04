const STORAGE_KEY = "printqr:shops";

export function getShops() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];

  const shops = JSON.parse(saved);
  if (!Array.isArray(shops)) throw new Error("Saved shop data is invalid.");
  return shops;
}

export function getShop(id) {
  return getShops().find((shop) => shop.id === id) || null;
}

export function saveShop(shop) {
  const shops = getShops().filter((saved) => saved.id !== shop.id);
  shops.unshift(shop);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shops));
}
