import os
from crewai.tools import BaseTool
from supabase import create_client

class SupabaseInventoryTool(BaseTool):
    name: str = "Query Supabase Inventory"
    description: str = (
        "Queries the Supabase 'inventory' table to get real-time stock levels, "
        "daily burn rates, and warehouse locations. Use this to determine how many "
        "days of supply remain for critical items."
    )

    def _run(self) -> str:
        """Connects to Supabase and returns current inventory status."""
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not supabase_url or not supabase_key:
            return "Error: Supabase configuration missing from environment variables."

        try:
            supabase = create_client(supabase_url, supabase_key)
            response = supabase.table("inventory").select("*").execute()
            
            if not response.data:
                return "The inventory table is currently empty or not initialized."
                
            result_str = "CURRENT INVENTORY DATA:\n"
            for item in response.data:
                days_left = item['current_stock'] / item['daily_burn_rate'] if item['daily_burn_rate'] > 0 else float('inf')
                result_str += f"- Item: {item['item_name']} (Category: {item['category']})\n"
                result_str += f"  Stock: {item['current_stock']} {item['unit']}, Burn Rate: {item['daily_burn_rate']} {item['unit']}/day\n"
                result_str += f"  Estimated Days Left: {days_left:.1f} days\n"
                result_str += f"  Warehouse: {item['warehouse_location']}\n\n"
            
            return result_str
            
        except Exception as e:
            return f"Failed to query Supabase database: {str(e)}"
