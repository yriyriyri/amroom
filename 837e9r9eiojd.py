import os

def generate_key():
    key = os.urandom(32)  
    return key.hex()  

if __name__ == "__main__":
    key = generate_key()
    print("Generated AES-256 Key (hex):", key)