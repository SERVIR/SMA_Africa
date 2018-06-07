from django.http import JsonResponse, HttpResponse, Http404
import datetime
import json
from utils import executeSMA
def get_plot(request):
    return_obj = {}
    context = {}

    if request.is_ajax() and request.method == 'POST':
        info = request.POST

        polygon = request.POST['polygon']
        start_date = request.POST['start_date']
        end_date = request.POST['end_date']
        start_date = datetime.datetime.strptime(start_date, '%B %d, %Y').strftime('%Y-%m-%d')
        end_date = datetime.datetime.strptime(end_date, '%B %d, %Y').strftime('%Y-%m-%d')

        polygon = json.loads(polygon)

        if polygon:
            try:
                ee_obj = executeSMA(polygon['coordinates'],start_date,end_date)

                return_obj["ee_obj"] = ee_obj
                return_obj["success"] = "success"
                return JsonResponse(return_obj)

            except Exception as e:
                return_obj["error"] = "Error Retrieving Data"
                return JsonResponse(return_obj)