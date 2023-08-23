MAX_NUMBER = 250_000

if __name__ == "__main__":
    print("started")
    for i in range(1, MAX_NUMBER + 1):
        print(f"{i:,} / {MAX_NUMBER:,}")
    print("done")
