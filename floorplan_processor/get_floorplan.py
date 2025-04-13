from touchstone_auth import TouchstoneSession, UsernamePassAuth

URL_BASE = "https://floorplans.mit.edu/"
PDF_FILE = "1_2.pdf"
URL = URL_BASE + PDF_FILE

with TouchstoneSession(
    base_url = URL_BASE,
    auth_type=UsernamePassAuth("username", "password"),
    cookiejar_filename='cookies.pickle'
) as session:
    # Authenticate and get the PDF file
    response = session.get(URL)
    if response.status_code == 200:
        print("Successfully authenticated and downloaded the PDF.")
    else:
        print(f"Failed to download the PDF. Status code: {response.status_code}")
    with open(PDF_FILE, "wb") as f:
        f.write(response.content)