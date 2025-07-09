def is_prime(n: int) -> bool:
    """
    Helper function to check if a number is prime.
    """
    if n < 2:
        return False
    if n == 2:
        return True
    if n % 2 == 0:
        return False
    for i in range(3, int(n**0.5) + 1, 2):
        if n % i == 0:
            return False
    return True


def kth_smallest_prime(arr: list[int], k: int) -> int:
    """
    Finds the kth smallest prime number in a sorted list.
    
    Parameters:
    - arr: A list of integers sorted in ascending order.
    - k: The position (1-based index) of the prime number to return.
    
    Returns:
    - The kth smallest prime number if it exists.
    - Raises ValueError if there are fewer than k prime numbers.
    """
    primes = [num for num in arr if is_prime(num)]
    
    if k <= 0:
        raise ValueError("k must be a positive integer.")
    if k > len(primes):
        raise ValueError(f"There are only {len(primes)} prime numbers in the list.")
    
    return primes[k - 1]
