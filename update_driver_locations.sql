-- Update all existing drivers to have a default location in Lagos
UPDATE drivers
SET 
  current_lat = 6.45407,
  current_lng = 3.42460
WHERE current_lat IS NULL OR current_lng IS NULL;

-- Also, insert default pricing settings if not exists
INSERT INTO settings (id, value) 
VALUES (
  'pricing_details', 
  '{"promoActive": true, "promoDiscountPercent": 20, "multipliers": {"airport": 0.65, "12hr": 1.0, "24hr": 1.95, "other": 0.15}}'
) ON CONFLICT (id) DO NOTHING;
