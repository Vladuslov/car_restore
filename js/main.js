jQuery(document).ready(function($){
	function ProductBuilder( element ) {
		this.element = element;
		this.stepsWrapper = this.element.children('.cd-builder-steps');
		this.steps = this.element.find('.builder-step');
		// сохраняем некоторые шаги конструктора
		this.models = this.element.find('[data-selection="models"]'); 
		this.summary;
		this.optionsLists = this.element.find('.options-list');
		// нижнее резюме
		this.fixedSummary = this.element.find('.cd-builder-footer');
		this.modelPreview = this.element.find('.selected-product').find('img');
		this.totPriceWrapper = this.element.find('.tot-price').find('b');
		// навигация по шагам конструктора
		this.mainNavigation = this.element.find('.cd-builder-main-nav');
		this.secondaryNavigation = this.element.find('.cd-builder-secondary-nav');
		// используется для проверки, правильно ли загружен контент конструктора
		this.loaded = true;
		
		// привязка событий конструктора
		this.bindEvents();
	}

	ProductBuilder.prototype.bindEvents = function() {
		var self = this;

		// обнаружение клика по левой навигации
		this.mainNavigation.on('click', 'li:not(.active)', function(event){
			event.preventDefault();
			self.loaded && self.newContentSelected($(this).index());
		});

		// обнаружение клика по нижней фиксированной навигации
		this.secondaryNavigation.on('click', '.nav-item li:not(.buy)', function(event){ 
			event.preventDefault();
			var stepNumber = ( $(this).parents('.next').length > 0 ) ? $(this).index() + 1 : $(this).index() - 1;
			self.loaded && self.newContentSelected(stepNumber);
		});
		// обнаружение клика по одному элементу в списке опций (например, модели, аксессуары)
		this.optionsLists.on('click', '.js-option', function(event){
			self.updateListOptions($(this));
		});
		// обнаружение кликов по элементам управления кастомизацией (например, цвета ...)
		this.stepsWrapper.on('click', '.cd-product-customizer a', function(event){
			event.preventDefault();
			self.customizeModel($(this));
		});
	};

	ProductBuilder.prototype.newContentSelected = function(nextStep) {
		// сначала - проверяем, был ли выбран модель - пользователь может переходить по шагам конструктора
		if( this.fixedSummary.hasClass('disabled') ) {
			// модель не выбрана - показываем предупреждение
			this.fixedSummary.addClass('show-alert');
		} else {
			// модель выбрана, показываем новый контент 
			// сначала проверяем, завершен ли шаг с выбором цвета - в этом случае обновляем превью продукта внизу
			if( this.steps.filter('.active').is('[data-selection="colors"]') ) {
				// в этом случае цвет был изменен - обновляем изображение в превью
				var imageSelected = this.steps.filter('.active').find('.cd-product-previews').children('.selected').children('img').attr('src');
				this.modelPreview.attr('src', imageSelected);
			}
			// если выбран шаг Summary (новый шаг, который будет показан) -> обновляем содержимое summary
			if( nextStep + 1 >= this.steps.length ) {
				this.createSummary();
			}
			
			this.showNewContent(nextStep);
			this.updatePrimaryNav(nextStep);
			this.updateSecondaryNav(nextStep);
		}
	}

	ProductBuilder.prototype.showNewContent = function(nextStep) {
		var actualStep = this.steps.filter('.active').index() + 1;
		if( actualStep < nextStep + 1 ) {
			// переходим к следующему разделу
			this.steps.eq(actualStep-1).removeClass('active back').addClass('move-left');
			this.steps.eq(nextStep).addClass('active').removeClass('move-left back');
		} else {
			// переходим к предыдущему разделу
			this.steps.eq(actualStep-1).removeClass('active back move-left');
			this.steps.eq(nextStep).addClass('active back').removeClass('move-left');
		}
	}

	ProductBuilder.prototype.updatePrimaryNav = function(nextStep) {
		this.mainNavigation.find('li').eq(nextStep).addClass('active').siblings('.active').removeClass('active');
	}

	ProductBuilder.prototype.updateSecondaryNav = function(nextStep) {
		( nextStep == 0 ) ? this.fixedSummary.addClass('step-1') : this.fixedSummary.removeClass('step-1');

		this.secondaryNavigation.find('.nav-item.next').find('li').eq(nextStep).addClass('visible').removeClass('visited').prevAll().removeClass('visited').addClass('visited').end().nextAll().removeClass('visible visited');
		this.secondaryNavigation.find('.nav-item.prev').find('li').eq(nextStep).addClass('visible').removeClass('visited').prevAll().removeClass('visited').addClass('visited').end().nextAll().removeClass('visible visited');
	}

	ProductBuilder.prototype.createSummary = function() {
		var self = this;
		this.steps.each(function(){
			// эта функция может нуждаться в обновлении в зависимости от ваших шагов конструктора и резюме
			var step = $(this);
			if( $(this).data('selection') == 'colors' ) {
				// создаем резюме по цвету
				var colorSelected = $(this).find('.cd-product-customizer').find('.selected'),
					color = colorSelected.children('a').data('color'),
					colorName = colorSelected.data('content'),
					imageSelected = $(this).find('.cd-product-previews').find('.selected img').attr('src');
				
				self.summary.find('.summary-color').find('.color-label').text(colorName).siblings('.color-swatch').attr('data-color', color);
				self.summary.find('.product-preview').attr('src', imageSelected);
			} else if( $(this).data('selection') == 'accessories' ) {
				var selectedOptions = $(this).find('.js-option.selected'),
					optionsContent = '';

				if( selectedOptions.length == 0 ) {
					optionsContent = '<li><p>Не выбраны аксессуары;</p></li>';
				} else {
					selectedOptions.each(function(){
						optionsContent +='<li><p>'+$(this).find('p').text()+'</p></li>';
					});
				}

				self.summary.find('.summary-accessories').children('li').remove().end().append($(optionsContent));
			}
		});
	}

	ProductBuilder.prototype.updateListOptions = function(listItem) {
		var self = this;
		
		if( listItem.hasClass('js-radio') ) {
			// это означает, что можно выбрать только один вариант (например, модели) - нужно проверить, был ли выбран другой вариант, и отменить его выбор
			var alreadySelectedOption = listItem.siblings('.selected'),
				price = (alreadySelectedOption.length > 0 ) ? -Number(alreadySelectedOption.data('price')) : 0;

			// если вариант уже был выбран и вы отменяете его, цена будет равна цене только что выбранного варианта
			( listItem.hasClass('selected') ) 
				? price = -Number(listItem.data('price'))
				: price = Number(listItem.data('price')) + price;

			// теперь отменим выбор всех остальных вариантов
			alreadySelectedOption.removeClass('selected');
			// переключаем только что выбранный вариант
			listItem.toggleClass('selected');
			// обновляем итоговую цену - только если это не шаг моделей
			(listItem.parents('[data-selection="models"]').length == 0) && self.updatePrice(price);
		} else {
			// можно выбрать несколько вариантов - нужно просто добавить/удалить только что выбранный
			var price = ( listItem.hasClass('selected') ) ? -Number(listItem.data('price')) : Number(listItem.data('price'));
			// переключаем только что выбранный вариант
			listItem.toggleClass('selected');
			// обновляем итоговую цену
			self.updatePrice(price);
		}
		
		if( listItem.parents('[data-selection="models"]').length > 0 ) {
			// так как модель была выбрана/отменена, нужно обновить контент конструктора
			self.updateModelContent(listItem);
		}
	};

	ProductBuilder.prototype.updateModelContent = function(model) {
		var self = this;
		if( model.hasClass('selected') ) {
			var modelType = model.data('model'),
				modelImage = model.find('img').attr('src');

			// нужно обновить изображение продукта в нижней фиксированной навигации
			this.modelPreview.attr('src', modelImage);

			// нужно обновить контент конструктора в соответствии с выбранным продуктом
			// сначала удаляем контент, который относится к другой модели
			this.models.siblings('li').remove();
			// затем загружаем новый контент
			$.ajax({
		        type       : "GET",
		        dataType   : "html",
		        url        : modelType+".html",
		        beforeSend : function(){
		        	self.loaded = false;
		        	model.siblings().removeClass('loaded');
		        },
		        success    : function(data){
		        	self.models.after(data);
		        	self.loaded = true;
		        	model.addClass('loaded');
		        	// активируем верхнюю и нижнюю навигацию
		        	self.fixedSummary.add(self.mainNavigation).removeClass('disabled show-alert');
		        	// обновляем свойства объекта
					self.steps = self.element.find('.builder-step');
					self.summary = self.element.find('[data-selection="summary"]');
					// обнаружение клика по одному элементу в списке опций
					self.optionsLists.off('click', '.js-option');
					self.optionsLists = self.element.find('.options-list');
					self.optionsLists.on('click', '.js-option', function(event){
						self.updateListOptions($(this));
					});

					// это нужно, чтобы не запускать анимацию при первой загрузке нового контента
					self.element.find('.first-load').removeClass('first-load');
		        },
		        error     : function(jqXHR, textStatus, errorThrown) {
		            // возможно, здесь стоит показать сообщение об ошибке
		        }
			});

			// обновляем цену (без добавления/удаления)
			this.totPriceWrapper.text(model.data('price'));
		} else {
			// модель не выбрана
			this.fixedSummary.add(this.mainNavigation).addClass('disabled');
			// обновляем цену
			this.totPriceWrapper.text('0');

			this.models.find('.loaded').removeClass('loaded');
		}
	};

	ProductBuilder.prototype.customizeModel = function(target) {
		var parent = target.parent('li')
			index = parent.index();
		
		// обновляем итоговую цену
		var price = ( parent.hasClass('selected') )
			? 0
			: Number(parent.data('price')) - parent.siblings('.selected').data('price');

		this.updatePrice(price);
		target.parent('li').addClass('selected').siblings().removeClass('selected').parents('.cd-product-customizer').siblings('.cd-product-previews').children('.selected').removeClass('selected').end().children('li').eq(index).addClass('selected');
	};

	ProductBuilder.prototype.updatePrice = function(price) {
		var actualPrice = Number(this.totPriceWrapper.text()) + price;
		this.totPriceWrapper.text(actualPrice);
	};

	if( $('.cd-product-builder').length > 0 ) {
		$('.cd-product-builder').each(function(){
			// создаем объект ProductBuilder для каждого .cd-product-builder
			new ProductBuilder($(this));
		});
	}
});
