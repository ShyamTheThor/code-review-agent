import asyncio
import os
from dotenv import load_dotenv
from hindsight_client import Hindsight

load_dotenv()

async def test_hindsight_connection():
    api_key = os.getenv("HINDSIGHT_API_KEY")
    base_url = os.getenv("HINDSIGHT_BASE_URL", "https://api.hindsight.vectorize.io")
    bank_id = os.getenv("HINDSIGHT_BANK_ID", "default")
    
    if not api_key:
        print("❌ HINDSIGHT_API_KEY not found in .env")
        return

    print(f"Connecting to {base_url}...")
    print(f"Using bank: {bank_id}...")
    
    client = None
    try:
        # Fixed: Added base_url which is required by the SDK
        client = Hindsight(api_key=api_key, base_url=base_url)
        
        # Test 1: Retain
        print("Testing RETAIN...")
        await client.aretain(bank_id=bank_id, content="Test memory: The user loves Python.")
        print("✅ Retain successful.")

        # Test 2: Recall
        print("Testing RECALL...")
        results = await client.arecall(bank_id=bank_id, query="What does the user love?")
        if results and hasattr(results, 'results') and len(results.results) > 0:
            print(f"✅ Recall successful. Found: {results.results[0].text[:50]}...")
        else:
            print("⚠️ Recall returned no results (might need a few seconds to index).")

        # Test 3: Reflect
        print("Testing REFLECT...")
        reflection = await client.areflect(bank_id=bank_id, query="Summarize what we know about the user.")
        # If reflection is a ReflectResponse object, extract text.
        text = getattr(reflection, 'text', str(reflection))
        print(f"✅ Reflect successful. Agent says: {text}")

    except Exception as e:
        print(f"❌ Connection failed: {str(e)}")
    finally:
        if client:
            await client.aclose()

if __name__ == "__main__":
    asyncio.run(test_hindsight_connection())
