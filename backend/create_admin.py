from getpass import getpass
from database import create_tables, get_connection
from auth import get_password_hash


def create_admin():
    create_tables()

    email = input("Enter Admin email: ").strip().lower()
    password = getpass("Enter Admin password: ")

    if len(password) < 8:
        print("Password must be at least 8 characters.")
        return

    connection = get_connection()

    try:
        existing = connection.execute(
            "SELECT id FROM users WHERE email = ?",
            (email,)
        ).fetchone()

        if existing:
            print("This email already exists.")
            return

        hashed_password = get_password_hash(password)

        connection.execute(
            """
            INSERT INTO users (email, password_hash, role, is_active)
            VALUES (?, ?, 'admin', 1)
            """,
            (email, hashed_password)
        )

        connection.commit()
        print("Admin account created successfully!")

    finally:
        connection.close()


if __name__ == "__main__":
    create_admin()