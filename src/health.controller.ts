import { Controller, Get, Head } from '@nestjs/common';

@Controller()
export class HealthController {
	@Head()
	@Get()
	health() {
		return { status: 'ok', timestamp: new Date().toISOString() };
	}
}
