# Database Schema Updates

## Supabase (PostgreSQL)

```sql
-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update Travel Events table (if not already present)
ALTER TABLE travel_events 
ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
```

## Prisma

```prisma
model Category {
  id        String   @id @default(cuid())
  name      String
  color     String   @default("#3b82f6")
  events    TravelEvent[]
  createdAt DateTime @default(now())
}

model TravelEvent {
  id         String   @id @default(cuid())
  title      String
  start      DateTime
  end        DateTime
  details    String?
  author     String
  locationId String?
  location   Place?   @relation(fields: [locationId], references: [id])
  categoryId String?
  category   Category? @relation(fields: [categoryId], references: [id])
}
```
