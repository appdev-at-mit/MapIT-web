import cv2

import pytesseract
import numpy as np
import pdf2image
from pdf2image import convert_from_path
import os
from tqdm import tqdm

FLOORPLAN_CONTOUR_INDEX = 0
HEADING_CONTOUR_INDEX = 6

HEADING_INDICATOR_CENTER = (228, 192)

# RED = (0, 0, 200, 255)
BLACK = (0, 0, 0, 255)

pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

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

    # # Use Tesseract to extract text
    # extracted_text = pytesseract.image_to_string(image_rgb)

    # return extracted_text
    data = pytesseract.image_to_data(image_rgb, output_type='dict')
    boxes = len(data['level'])
    for i in range(boxes ):
        (x, y, w, h) = (data['left'][i], data['top'][i], data['width'][i], data['height'][i])
        #Draw box        
        cv2.rectangle(image_rgb, (x, y), (x + w, y + h), (0, 255, 0), 2)
    return image_rgb

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
    #blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]
    morph = cv2.dilate(thresh, kernel=np.ones((30, 30), np.uint8))
    morph = cv2.erode(morph, kernel=np.ones((15, 15), np.uint8))
    cv2.imwrite("morph.png", morph)
    # edges = cv2.Canny(morph, 50, 150)
    # cv2.imwrite("edges.png", edges)
    contours, _ = cv2.findContours(morph, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    ret = []
    contours = sorted(contours, key=cv2.contourArea, reverse=True)
    full_contours = []
    for contour in contours:
        if cv2.contourArea(contour) > 1000:
            full_contours.append(contour)
            break
    full_contour = np.vstack(full_contours)
    contour = full_contour#fix_contour(full_contour, image)

    mask = np.zeros(image.shape, dtype=np.uint8)
    cv2.drawContours(mask, [contour], -1, (255, 255, 255, 255), -1)
    mask = cv2.bitwise_and(image, mask)
    x, y, w, h = cv2.boundingRect(contour)
    cropped = mask[y : y + h, x : x + w]

    # postprocess image
    kernel = np.ones((3, 3), np.uint8)
    cropped = cv2.erode(cropped, kernel, iterations=1)
    black_mask = cv2.inRange(cropped, (0, 0, 0, 255), (200, 200, 200, 255))
    cropped[black_mask > 0] = BLACK

    return cropped


def fix_contour(contour, img):
    # walk along contour and run a pseudo convex hull with threshold
    # take the convex hull, and figure out where to break it
    # metric: distance / number of points skipped, lower metric better
    # print("Contour: ", contour)

    # rearrange contour to run clockwise from center mass
    # cm = np.mean(contour, axis=0)[0]
    # contour = sorted(contour, key=lambda x: np.arctan2(x[0][1] - cm[1], x[0][0] - cm[0]))
    # # filter points too close to the center
    # contour = [point for point in contour if np.linalg.norm(point[0] - cm) > 100]
    # contour = np.array(contour)
    
    hull = cv2.convexHull(contour, returnPoints=False)
    # return hull

    # print("Hull: ", hull)
    try:
        defects = cv2.convexityDefects(contour, hull)
    except:
        print("WARNING: convexity defect detection failed, self intersection?")
        return contour
    # print("Defects: ", defects)
    defects_dict = {
        defect[0][0]: (defect[0][0], defect[0][1], defect[0][2], defect[0][3]) for defect in defects
    } if defects is not None else {}

    cur = 0
    fixed_contour = []
    while cur < len(contour):
        fixed_contour.append([contour[cur][0]])
        if cur in defects_dict:
            s, e, f, depth = defects_dict[cur]
            delta = contour[s][0] - contour[e][0]
            distance = delta[0] ** 2 + delta[1] ** 2
            distance = np.sqrt(distance)
            if distance < 10:
                cur += 1
                continue
            print(contour[s][0], contour[e][0])
            depth /= 256.0
            perim = cv2.arcLength(contour[s:e], False)
            area = cv2.contourArea(contour[s:e] + contour[s])
            cv2.drawContours(img, [contour[s:e] + contour[s]], -1, (0, 255, 0, 255), 3)
            metric = distance / area
            #print("Distance:", distance, "Perim:", perim)
            print(metric)
            if metric < 0.01:
                cur = e
            else:
                cur += 1
        else:
            cur += 1
    #img = cv2.resize(img, (0, 0), fx=0.2, fy=0.2)
    # cv2.imshow("contour", img)
    # cv2.imwrite("contour.png", img)
    # cv2.waitKey(0)
    fixed_contour = np.array(fixed_contour)
    return fixed_contour

    # if len(defects) == 0:
    #     return contour
    # fixed_contour = []
    # last_end = None
    # first_start = None
    # for i in range(defects.shape[0]):
    #     s, e, f, d = defects[i][0]
    #     metric = d / (e - s)
    #     if metric > 0.1:
    #         continue
    #     if first_start is None:
    #         first_start = s
    #     if last_end is not None:
    #         for j in range(last_end, s):
    #             fixed_contour.append(contour[j][0])
    #     fixed_contour.append(contour[s][0])
    #     last_end = e
    # if last_end is not None:
    #     for j in range(last_end, len(contour)):
    #         fixed_contour.append(contour[j][0])
    # if first_start is not None:
    #     for j in range(first_start):
    #         fixed_contour.append(contour[j][0])
    # fixed_contour = np.array(fixed_contour)

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

m = {}
def run_file(fname):
    img = render_pdf(fname)[0]
    img = np.array(img)
    sections = extract_outer_rect_contour(img)
    # floorplan = extract_building_contour(sections[FLOORPLAN_CONTOUR_INDEX])
    heading = extract_heading(sections[HEADING_CONTOUR_INDEX])
    # floorplan = rotate_image(floorplan, 90 - heading)
    print("Heading:", heading)
    m[fname.split("_")[0].split("/")[1]] = heading
    # print("contours/" + fname.split(".")[0].split("/")[1] + ".png")
    # cv2.imwrite("contours/" + fname.split(".")[0].split("/")[1] + ".png", floorplan)
    # cv2.imwrite("heading_img.png", sections[HEADING_CONTOUR_INDEX])
    # cv2.waitKey(0)

for fname in tqdm(os.listdir("floorplans")):
    if fname.endswith(".pdf"):
        if fname.split("_")[0] in m:
            continue
        run_file("floorplans/" + fname)
import json
with open("orientations.json", "w") as f:
    json.dump(m, f, indent=4)

# run_file("floorplans/2_0.pdf")

# if __name__ == "__main__":
#     img = render_pdf("1_1.pdf")[0]
#     img = np.array(img)
#     sections = extract_outer_rect_contour(img)

#     floorplan = extract_building_contour(sections[FLOORPLAN_CONTOUR_INDEX])

#     cv2.imshow("floorplan", cv2.resize(floorplan, (0, 0), fx=0.5, fy=0.5))
#     cv2.imshow(
#         "heading_box", cv2.resize(sections[HEADING_CONTOUR_INDEX], (0, 0), fx=0.5, fy=0.5)
#     )

#     # text = extract_text_from_image(sections[FLOORPLAN_CONTOUR_INDEX])
#     # print("Text: ", text)

#     img_text = extract_text_from_image(sections[FLOORPLAN_CONTOUR_INDEX])
#     cv2.imshow("img_text", img_text)
#     cv2.imwrite("img_text.png", img_text)

#     heading = extract_heading(sections[HEADING_CONTOUR_INDEX])
#     floorplan = rotate_image(floorplan, 90 - heading)
#     print("Heading:", heading)
#     cv2.imwrite("floorplan.png", floorplan)
#     cv2.imwrite("heading_img.png", sections[HEADING_CONTOUR_INDEX])
#     cv2.waitKey(0)
