from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from tethys_sdk.gizmos import Button,DatePicker
import time,datetime
def home(request):
    """
    Controller for the app home page.
    """

    start_date = DatePicker(
        name='start_date',
        display_text='Start Date',
        autoclose=True,
        format='MM d, yyyy',
        start_date='1/1/2003',
        end_date=time.strftime("%m/%d/%Y"),
        start_view='decade',
        today_button=True,
        initial='January 1, 2003'
    )

    end_date = DatePicker(
        name='end_date',
        display_text='End Date',
        autoclose=True,
        format='MM d, yyyy',
        start_date='1/1/2003',
        end_date=time.strftime("%m/%d/%Y"),
        start_view='decade',
        today_button=True,
        initial='January 1, 2018'
    )

    context = {
        'start_date':start_date,
        'end_date':end_date
    }

    return render(request, 'sma_africa/home.html', context)