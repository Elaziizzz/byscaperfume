-- Create materials table
CREATE TABLE IF NOT EXISTS public.materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    current_stock INTEGER NOT NULL DEFAULT 0,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create transaction type enum
CREATE TYPE public.transaction_type AS ENUM ('IN', 'OUT');

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
    type public.transaction_type NOT NULL DEFAULT 'OUT',
    quantity INTEGER NOT NULL,
    total_price NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS (Row Level Security) - For MVP we will allow all access
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for materials" ON public.materials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);

-- Function to automatically adjust stock after a transaction
CREATE OR REPLACE FUNCTION public.adjust_stock_after_transaction()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.type = 'IN' THEN
        UPDATE public.materials
        SET current_stock = current_stock + NEW.quantity
        WHERE id = NEW.material_id;
    ELSIF NEW.type = 'OUT' THEN
        UPDATE public.materials
        SET current_stock = current_stock - NEW.quantity
        WHERE id = NEW.material_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the function on new transactions
CREATE TRIGGER tr_adjust_stock
AFTER INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.adjust_stock_after_transaction();

-- Enable Realtime for both tables
alter publication supabase_realtime add table public.materials;
alter publication supabase_realtime add table public.transactions;

-- Insert some dummy data for initial testing
INSERT INTO public.materials (name, current_stock, price) VALUES 
('Semen Tiga Roda 50kg', 100, 55000),
('Besi Beton 10mm', 250, 75000),
('Pasir Merapi (Pick Up)', 20, 150000),
('Batu Bata Merah', 5000, 800),
('Cat Tembok Dulux 5kg', 50, 120000);
