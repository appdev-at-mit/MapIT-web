import cv2

# import pytesseract
import numpy as np
import pdf2image
from pdf2image import convert_from_path

FLOORPLAN_CONTOUR_INDEX = 0
HEADING_CONTOUR_INDEX = 6

HEADING_INDICATOR_CENTER = (228, 192)

RED = (0, 0, 200, 255)


def render_pdf(pdf_path):
    """
    Convert a PDF file to images.
    :param pdf_path: Path to the PDF file.
    :return: List of images.
    """
    images = convert_from_path(
        pdf_path, dpi=600, poppler_path="poppler-24.08.0/Library/bin"
    )
    return images


def extract_heading(heading_image):
    """
    Extract heading cropped arrow indicator.
    :return: Heading angle.
    """
    # erosion
    heading_image = cv2.cvtColor(heading_image, cv2.COLOR_BGR2GRAY)
    heading_image = cv2.threshold(
        heading_image, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU
    )[1]
    kernel = np.ones((10, 10), np.uint8)
    eroded = cv2.erode(heading_image, kernel, iterations=1)
    cv2.imshow("heading_cleaned", eroded)
    """
    # hough lines
    lines = cv2.HoughLinesP(eroded, 1, np.pi / 180, threshold=50, minLineLength=50, maxLineGap=10)
    # find angle of lines
    angles = []
    for line in lines:
        x1, y1, x2, y2 = line[0]
        angle = np.arctan2(y2 - y1, x2 - x1) * 180 / np.pi
        angles.append(angle)
    """
    x = []
    y = []
    pts = np.where(eroded == 255)
    for i in range(len(pts[0])):
        x.append(pts[1][i])
        y.append(pts[0][i])
    # find average angle
    x_avg = np.mean(x)
    y_avg = np.mean(y)
    # find angle of line from center to average point
    x_avg_centered = x_avg - HEADING_INDICATOR_CENTER[0]
    y_avg_centered = HEADING_INDICATOR_CENTER[1] - y_avg
    angle = np.arctan2(y_avg_centered, x_avg_centered) * 180 / np.pi
    # normalize angle to 0-360
    return angle + 360 if angle < 0 else angle


def extract_text_from_image(image):
    """
    Extract text from an image using Tesseract OCR.
    :param image: Image to extract text from.
    :return: Extracted text.
    """
    # Convert the image to RGB (Tesseract requires RGB format)
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    # Use Tesseract to extract text
    extracted_text = pytesseract.image_to_string(image_rgb)

    return extracted_text


def extract_outer_rect_contour(image):
    """
    Extract contours from an image. Used to extract
    highest level sections from document.
    :param image: Image to extract contours from.
    :return: Contours, cropped to bounding rects, sorted by area.
    """

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 150)
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    ret = []
    contours = sorted(contours, key=cv2.contourArea, reverse=True)
    for contour in contours:
        if cv2.contourArea(contour) > 1000:
            x, y, w, h = cv2.boundingRect(contour)
            cropped = image[y : y + h, x : x + w]
            ret.append(cropped)
    return ret


def extract_building_contour(image):
    """
    Extract contours from an image. Used to extract
    the outer building contour from the document.
    :param image: Image to extract contours from.
    :return: Single outer contour of building.
    """

    image = image[100:-100, 100:-100]
    # add alpha channel
    image = cv2.cvtColor(image, cv2.COLOR_BGR2BGRA)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 150)
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    ret = []
    contours = sorted(contours, key=cv2.contourArea, reverse=True)
    for contour in contours:
        if cv2.contourArea(contour) > 1000:
            mask = np.zeros(image.shape, dtype=np.uint8)
            cv2.drawContours(mask, [contour], -1, (255, 255, 255, 255), -1)
            mask = cv2.bitwise_and(image, mask)
            x, y, w, h = cv2.boundingRect(contour)
            cropped = mask[y : y + h, x : x + w]

            # postprocess image
            kernel = np.ones((3, 3), np.uint8)
            cropped = cv2.erode(cropped, kernel, iterations=1)
            black_mask = cv2.inRange(cropped, (0, 0, 0, 255), (200, 200, 200, 255))
            cropped[black_mask > 0] = RED

            return cropped
    return None


def rotate_image(mat, angle):
    """
    Rotates an image (angle in degrees) and expands image to avoid cropping
    :param mat: Image to rotate.
    :param angle: Angle to rotate the image (degrees)
    """

    height, width = mat.shape[:2]  # image shape has 3 dimensions
    image_center = (
        width / 2,
        height / 2,
    )  # getRotationMatrix2D needs coordinates in reverse order (width, height) compared to shape

    rotation_mat = cv2.getRotationMatrix2D(image_center, angle, 1.0)

    # rotation calculates the cos and sin, taking absolutes of those.
    abs_cos = abs(rotation_mat[0, 0])
    abs_sin = abs(rotation_mat[0, 1])

    # find the new width and height bounds
    bound_w = int(height * abs_sin + width * abs_cos)
    bound_h = int(height * abs_cos + width * abs_sin)

    # subtract old image center (bringing image back to origo) and adding the new image center coordinates
    rotation_mat[0, 2] += bound_w / 2 - image_center[0]
    rotation_mat[1, 2] += bound_h / 2 - image_center[1]

    # rotate image with the new bounds and translated rotation matrix
    rotated_mat = cv2.warpAffine(mat, rotation_mat, (bound_w, bound_h))
    return rotated_mat


img = render_pdf("1_1.pdf")[0]
img = np.array(img)
sections = extract_outer_rect_contour(img)

floorplan = extract_building_contour(sections[FLOORPLAN_CONTOUR_INDEX])

cv2.imshow("floorplan", cv2.resize(floorplan, (0, 0), fx=0.5, fy=0.5))
cv2.imshow(
    "heading_box", cv2.resize(sections[HEADING_CONTOUR_INDEX], (0, 0), fx=0.5, fy=0.5)
)

# text = extract_text_from_image(sections[FLOORPLAN_CONTOUR_INDEX])
# print("Text: ", text)

heading = extract_heading(sections[HEADING_CONTOUR_INDEX])
floorplan = rotate_image(floorplan, 90 - heading)
print("Heading:", heading)
cv2.imwrite("floorplan.png", floorplan)
cv2.imwrite("heading_img.png", sections[HEADING_CONTOUR_INDEX])
cv2.waitKey(0)
