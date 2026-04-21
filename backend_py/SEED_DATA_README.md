# Seed Data Instructions

## How to Load Seed Data

### Option 1: Using MySQL Command Line

1. Make sure MySQL is running and the database `milk_management_db` is created
2. Run the schema first (if not done already):
   ```bash
   mysql -u root -p milk_management_db < schema.sql
   ```

3. Then load the seed data:
   ```bash
   mysql -u root -p milk_management_db < seed_data.sql
   ```

### Option 2: Using MySQL Workbench

1. Open MySQL Workbench and connect to your MySQL server
2. Open the `seed_data.sql` file
3. Select the `milk_management_db` database from the dropdown
4. Click the lightning bolt icon (Execute) to run the script

### Option 3: Using MySQL Command Line Interactive

1. Open MySQL command line:
   ```bash
   mysql -u root -p
   ```

2. Select the database:
   ```sql
   USE milk_management_db;
   ```

3. Run the seed file:
   ```sql
   source E:/Milk_management/backend_py/seed_data.sql
   ```

## What Gets Created

The seed data includes:
- **12 Customers** (11 active, 1 inactive)
- **70 Delivery records** (last 7 days for 10 active customers)
- **10 Bills** (current month, 4 paid, 6 unpaid)
- **4 Payments** (for the paid bills)
- **4 Expenses** (transport, maintenance, etc.)
- **3 Milk price history** entries

## Sample Data Overview

### Customers:
1. Rajesh Kumar - 2L/day @ ₹60/L (Morning)
2. Srinivas Rao - 1.5L/day @ ₹58/L (Morning)
3. Venkat Reddy - 3L/day @ ₹62/L (Evening)
4. Lakshmi Devi - 1L/day @ ₹55/L (Morning)
5. Krishna Murthy - 2.5L/day @ ₹60/L (Evening)
6. Ravi Shankar - 1L/day @ ₹56/L (Morning, Occasional)
7. Suresh Babu - 2L/day @ ₹59/L (Morning)
8. Anjali Sharma - 1.5L/day @ ₹58/L (Evening)
9. Prakash Reddy - 3.5L/day @ ₹64/L (Morning)
10. Meena Kumari - 2L/day @ ₹60/L (Morning)
11. Ramesh Gupta - 1L/day @ ₹55/L (Evening, Inactive)
12. Sanjay Patel - 2.5L/day @ ₹61/L (Morning)

## After Loading

1. Start the backend: `python app.py`
2. Start the frontend: `npm start`
3. All data will be loaded automatically!

## Notes

- The seed data clears all existing data before inserting
- Delivery dates are relative to current date (last 7 days)
- Bills are for the current month
- All phone numbers are unique (9876543210-9876543221)
