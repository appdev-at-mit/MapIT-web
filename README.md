# Onboarding

1. Navigate to the folder where you want to download the code in your IDE.
2. Clone the Github Repository with git clone <this repository's url>.
3. In the terminal (root directory), run 'npm install'.
4. In the root directory, create a .env file.
5. Ask Hailey to send you a copy of the .env file contents.
6. Ask Hailey to be added to the MongoDB database. You should provide a preferred email.
7. In MongoDB Atlas, obtain the Mongo URI connection string along with your created database password.
8. In the .env file, replace the string inside MONGO_SRV with your own connection string. Be sure to replace <db_password> with your own password that you obtained from step 7.
9. Then open two separate terminals, and 'npm run dev' in the first, and 'npm start' in the second.
10. You should see in the terminal where you ran 'npm start' that you are connected to MongoDB.
11. Open http://localhost:5173
