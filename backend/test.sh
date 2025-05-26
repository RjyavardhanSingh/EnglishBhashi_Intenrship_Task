#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Base URL
BASE_URL="http://localhost:5000/api"

# Test variables
ADMIN_TOKEN=""
LEARNER_TOKEN=""
COURSE_ID=""
SECTION_ID=""
UNIT_ID=""
CHAPTER_ID=""

echo "🚀 Starting API tests..."

# Function to check JSON response for error
check_error() {
    if echo "$1" | grep -q '"message"'; then
        return 1
    fi
    return 0
}

# Function to print success/failure
print_result() {
    if [ $1 -eq 0 ] && check_error "$3"; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
        echo "Response: $3"
        exit 1
    fi
}

# 1. Register Admin
echo -e "\n📝 Testing Admin Registration..."
ADMIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
        "username": "admin",
        "email": "admin@test.com",
        "password": "Admin@123",
        "firstName": "Admin",
        "lastName": "User",
        "role": "admin"
    }')

ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | grep -o '"token":"[^"]*' | grep -o '[^"]*$')
print_result $? "Admin Registration" "$ADMIN_RESPONSE"

# 2. Register Learner
echo -e "\n📝 Testing Learner Registration..."
LEARNER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
        "username": "learner",
        "email": "learner@test.com",
        "password": "Learner@123",
        "firstName": "Learner",
        "lastName": "User",
        "role": "learner"
    }')

LEARNER_TOKEN=$(echo $LEARNER_RESPONSE | grep -o '"token":"[^"]*' | grep -o '[^"]*$')
print_result $? "Learner Registration" "$LEARNER_RESPONSE"

# 3. Create Course (Admin)
echo -e "\n📚 Testing Course Creation..."
COURSE_RESPONSE=$(curl -s -X POST "$BASE_URL/courses" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{
        "title": "English Grammar Basics",
        "description": "Learn basic English grammar rules",
        "level": "BEGINNER",
        "duration": 3600
    }')

COURSE_ID=$(echo $COURSE_RESPONSE | grep -o '"_id":"[^"]*' | grep -o '[^"]*$')
print_result $? "Course Creation" "$COURSE_RESPONSE"

# 4. Add Section to Course
echo -e "\n📑 Testing Section Creation..."
SECTION_RESPONSE=$(curl -s -X POST "$BASE_URL/courses/$COURSE_ID/sections" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{
        "title": "Nouns",
        "description": "Understanding nouns in English",
        "order": 1
    }')

SECTION_ID=$(echo $SECTION_RESPONSE | grep -o '"_id":"[^"]*' | grep -o '[^"]*$')
print_result $? "Section Creation" "$SECTION_RESPONSE"

# 5. Add Unit to Section
echo -e "\n📖 Testing Unit Creation..."
UNIT_RESPONSE=$(curl -s -X POST "$BASE_URL/courses/$COURSE_ID/sections/$SECTION_ID/units" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{
        "title": "Common Nouns",
        "description": "Understanding common nouns",
        "order": 1
    }')

UNIT_ID=$(echo $UNIT_RESPONSE | grep -o '"_id":"[^"]*' | grep -o '[^"]*$')
print_result $? "Unit Creation" "$UNIT_RESPONSE"

# 6. Add Chapter with Questions
echo -e "\n📝 Testing Chapter Creation..."
CHAPTER_RESPONSE=$(curl -s -X POST "$BASE_URL/courses/$COURSE_ID/sections/$SECTION_ID/units/$UNIT_ID/chapters" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{
        "title": "Identifying Common Nouns",
        "description": "Learn to identify common nouns in sentences",
        "order": 1,
        "questions": [{
            "questionType": "MCQ",
            "questionText": "Which word is a common noun?",
            "options": ["dog", "John", "Monday", "Europe"],
            "correctAnswer": "dog"
        }]
    }')

CHAPTER_ID=$(echo $CHAPTER_RESPONSE | jq -r '._id')
print_result $? "Chapter Creation" "$CHAPTER_RESPONSE"

# 7. Publish Course
echo -e "\n📢 Testing Course Publishing..."
PUBLISH_RESPONSE=$(curl -s -X PATCH "$BASE_URL/courses/$COURSE_ID/publish" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
print_result $? "Course Publishing" "$PUBLISH_RESPONSE"

# 8. Enroll Learner in Course
echo -e "\n📋 Testing Course Enrollment..."
ENROLL_RESPONSE=$(curl -s -X POST "$BASE_URL/courses/$COURSE_ID/enroll" \
    -H "Authorization: Bearer $LEARNER_TOKEN")
print_result $? "Course Enrollment" "$ENROLL_RESPONSE"

# 9. Submit Answer to Question (first getting the question ID)
echo -e "\n🔍 Debug Chapter Response:"
echo "$CHAPTER_RESPONSE" | jq '.'

QUESTION_ID=$(echo $CHAPTER_RESPONSE | jq -r '.questions[0]._id')
echo -e "\n🔑 Question ID: $QUESTION_ID"
echo -e "\n✍️ Testing Answer Submission..."
if [ -z "$QUESTION_ID" ]; then
    echo -e "${RED}✗ No question ID found in chapter response${NC}"
    exit 1
fi

echo -e "Submitting answer for question: $QUESTION_ID"

echo -e "\nSubmitting answer with:"
echo "Course ID: $COURSE_ID"
echo "Section ID: $SECTION_ID"
echo "Unit ID: $UNIT_ID"
echo "Chapter ID: $CHAPTER_ID"
echo "Question ID: $QUESTION_ID"

# URL encode each component individually
encoded_course_id=$(echo "$COURSE_ID" | sed 's/[^[:alnum:]]/%&/g')
encoded_section_id=$(echo "$SECTION_ID" | sed 's/[^[:alnum:]]/%&/g')
encoded_unit_id=$(echo "$UNIT_ID" | sed 's/[^[:alnum:]]/%&/g')
encoded_chapter_id=$(echo "$CHAPTER_ID" | sed 's/[^[:alnum:]]/%&/g')
encoded_question_id=$(echo "$QUESTION_ID" | sed 's/[^[:alnum:]]/%&/g')

# Construct the URL with encoded components
submit_url="$BASE_URL/courses/$encoded_course_id/sections/$encoded_section_id/units/$encoded_unit_id/chapters/$encoded_chapter_id/questions/$encoded_question_id/submit"
echo -e "\nRequest URL: $submit_url"

SUBMIT_RESPONSE=$(curl -s -X POST "$submit_url" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $LEARNER_TOKEN" \
    -d '{
        "answer": "dog"
    }' 2>&1)

echo -e "\nFull Response:"
echo "$SUBMIT_RESPONSE"

# Extract just the response body for the print_result function
RESPONSE_BODY=$(echo "$SUBMIT_RESPONSE" | sed -n -e '/^{/,/^}/p')
if [ -z "$RESPONSE_BODY" ]; then
    RESPONSE_BODY="$SUBMIT_RESPONSE"
fi

print_result $? "Answer Submission" "$RESPONSE_BODY"

# 10. Get Progress
echo -e "\n📊 Testing Progress Retrieval..."
PROGRESS_RESPONSE=$(curl -s -X GET "$BASE_URL/progress/$COURSE_ID" \
    -H "Authorization: Bearer $LEARNER_TOKEN")
print_result $? "Progress Retrieval" "$PROGRESS_RESPONSE"

echo -e "\n✨ Testing completed!"
