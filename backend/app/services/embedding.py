from sentence_transformers import SentenceTransformer

# Load the model at module initialization (lazy singleton behavior)
model = SentenceTransformer('all-MiniLM-L6-v2')

def generate_embedding(title: str, description: str, condition: str) -> list[float]:
    """Concatenate text fields -> embed as single 384-dim vector."""
    text = f"{title}. {description or ''}. Condition: {condition}"
    embedding = model.encode(text)
    return embedding.tolist()
