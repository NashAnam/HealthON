-- QUICK TEST: Run this in Supabase SQL Editor to verify the payment exists

SELECT 
    p.id,
    p.created_at,
    p.amount,
    p.payment_status,
    p.transaction_id,
    p.patient_id,
    pt.name as patient_name,
    pt.phone as patient_phone
FROM payments p
LEFT JOIN patients pt ON p.patient_id = pt.id
WHERE p.payment_status = 'pending_verification'
ORDER BY p.created_at DESC;

-- If you see results here but not in admin page, it's a frontend issue
-- If you see NO results, the payment was deleted or status changed
