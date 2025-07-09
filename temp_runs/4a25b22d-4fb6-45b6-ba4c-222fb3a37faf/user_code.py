def is_prime(n: int) -> bool:
    """
    Helper to check primality.
    """
    if n < 2:
        return False
    if n == 2:
        return True
    if n % 2 == 0:
        return False
    for i in range(3, int(n ** 0.5) + 1, 2):
        if n % i == 0:
            return False
    return True


def kth_smallest_prime(n: int, k: int) -> int:
    """
    Generate the first 'n' prime numbers and return the k-th smallest among them.

    Parameters:
    - n: total number of prime numbers to generate.
    - k: index (1-based) of the prime to return from the generated list.

    Returns:
    - The k-th smallest prime from the first 'n' primes.
    """
    primes = []
    candidate = 2

    while len(primes) < n:
        if is_prime(candidate):
            primes.append(candidate)
        candidate += 1

    if k <= 0 or k > len(primes):
        raise ValueError("Invalid value of k")

    re
