import random
import json

NUM_TEACHERS = 12
OUTPUT_FILE = "terna_teachers_dataset.json"

departments = ["aids", "comps", "extc", "elex", "mechatronics", "mechanical", "civil", "it"]

first_names = [
    "Anil", "Sunita", "Rajesh", "Meena", "Suresh", "Kavita", "Prakash",
    "Rekha", "Vijay", "Alka", "Manoj", "Neelam", "Rakesh", "Seema",
    "Deepak", "Shalini", "Ashok", "Poonam", "Vinod", "Geeta"
]

last_names = [
    "Sharma", "Patil", "Deshmukh", "Kulkarni", "Naik", "Iyer",
    "Singh", "Mehta", "Verma", "Joshi", "Gupta", "Reddy",
    "Nair", "Chopra", "Bose", "Kapoor", "Jain", "Malhotra"
]

subjects_pool = {
    "aids": ["Machine Learning", "AI", "Data Science", "Python"],
    "comps": ["DSA", "Operating Systems", "DBMS", "Java"],
    "it": ["Web Development", "Cloud Computing", "Networking"],
    "extc": ["VLSI", "Digital Communication", "Signals"],
    "elex": ["Circuits", "Microcontrollers", "Electronics"],
    "mechanical": ["Thermodynamics", "Fluid Mechanics", "CAD"],
    "civil": ["Structural Analysis", "Surveying", "Geotechnical"],
    "mechatronics": ["Robotics", "Control Systems", "Embedded Systems"]
}

roles = ["teacher", "teacher", "teacher", "teacher", "teacher", "hod"]  # weighted

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

def generate_teacher(teacher_id):
    first = random.choice(first_names)
    last = random.choice(last_names)

    name = f"{first} {last}"
    department = random.choice(departments)
    email = generate_unique_email(first, last)
    phone = generate_phone()
    role = random.choice(roles)

    subjects = random.sample(subjects_pool[department], random.randint(1, 2))

    experience = random.randint(2, 20)  # years
    rating = round(random.uniform(3.5, 4.9), 1)

    return {
        "id": teacher_id,
        "name": name,
        "email": email,
        "department": department,
        "role": role,
        "subjects": subjects,
        "experienceYears": experience,
        "rating": rating,
        "phone": phone
    }

def generate_dataset(n):
    return [generate_teacher(i + 1) for i in range(n)]

def save_to_file(data, filename):
    with open(filename, "w") as f:
        json.dump(data, f, indent=2)

if __name__ == "__main__":
    dataset = generate_dataset(NUM_TEACHERS)
    save_to_file(dataset, OUTPUT_FILE)
    print(f"Teacher dataset generated: {OUTPUT_FILE}")