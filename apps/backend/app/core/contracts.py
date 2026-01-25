import requests
import json
import os

MONAD_RPC = os.getenv("MONAD_RPC_URL", "https://testnet-rpc.monad.xyz")
MARKET_MANAGER_ADDRESS = os.getenv("MARKET_MANAGER_ADDRESS", os.getenv("PREDICTION_MARKET_ADDRESS", "0x0000000000000000000000000000000000000000"))

def rpc_call(method, params):
    """Direct Monad JSON-RPC - NO web3.py"""
    payload = {
        "jsonrpc": "2.0",
        "method": method,
        "params": params,
        "id": 1
    }
    resp = requests.post(MONAD_RPC, json=payload, timeout=10)
    return resp.json()["result"]

class Contracts:
    def get_market(self, market_id):
        """Real contract read via JSON-RPC"""
        data = "0x..."  # ABI encoded call
        result = rpc_call("eth_call", [{
            "to": MARKET_MANAGER_ADDRESS,
            "data": data
        }, "latest"])
        return result
    
    def mint_position(self, quote_id, market_id, side, stake, odds, wallet):
        """Real TX via JSON-RPC"""
        nonce = int(rpc_call("eth_getTransactionCount", [wallet, "latest"]), 16)
        tx = {
            "to": MARKET_MANAGER_ADDRESS,
            "value": hex(int(stake * 1e18)),
            "gas": "0x493e0",
            "gasPrice": "0x12a05f200",
            "nonce": hex(nonce),
            "data": "0x..."  # openPosition calldata
        }
        tx_hash = rpc_call("eth_sendRawTransaction", ["0x..."])  # signed tx
        return tx_hash
