import random
import json

NUM_TNP = 5
OUTPUT_FILE = "terna_tnp_officers_dataset.json"

first_names = [
    "Anil", "Sunita", "Rajesh", "Meena", "Suresh",
    "Kavita", "Prakash", "Rekha", "Vijay", "Alka",
    "Manoj", "Neelam", "Rakesh", "Seema", "Deepak"
]

last_names = [
    "Sharma", "Patil", "Deshmukh", "Kulkarni", "Naik",
    "Iyer", "Singh", "Mehta", "Verma", "Joshi",
    "Gupta", "Reddy", "Nair", "Chopra", "Kapoor"
]

departments = ["aids", "comps", "extc", "elex", "mechatronics", "mechanical", "civil", "it"]

used_emails = set()

def generate_phone():
    return f"9{random.randint(100000000, 999999999)}"

def generate_unique_email(first, last):
    base = f"{first.lower()}.{last.lower()}"
    email = f"{base}@terna.edu"

    counter = 1
    while email in used_emails:
        email = f"{base}{counter}@terna.edu"
        counter += 1

    used_emails.add(email)
    return email

def generate_tnp_officer(officer_id):
    first = random.choice(first_names)
    last = random.choice(last_names)

    name = f"{first} {last}"
    email = generate_unique_email(first, last)
    phone = generate_phone()
    department = random.choice(departments)

    experience = random.randint(8, 25)  # higher than teachers
    designation = random.choice([
        "TNP Officer",
        "Placement Head",
        "Training & Placement Coordinator"
    ])

    return {
        "id": officer_id,
        "name": name,
        "email": email,
        "department": department,
        "role": "tnp_officer",  # 🔥 highest privilege
        "designation": designation,
        "experienceYears": experience,
        "phone": phone
    }

def generate_dataset(n):
    return [generate_tnp_officer(i + 1) for i in range(n)]

def save_to_file(data, filename):
    with open(filename, "w") as f:
        json.dump(data, f, indent=2)

if __name__ == "__main__":
    dataset = generate_dataset(NUM_TNP)
    save_to_file(dataset, OUTPUT_FILE)
    print(f"TNP Officers dataset generated: {OUTPUT_FILE}")